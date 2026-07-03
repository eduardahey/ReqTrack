import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { sendPasswordResetCode } from '../services/email.service.js'

const CODE_EXPIRATION_MINUTES = 10

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6 dígitos
}

export async function requestReset(req, res) {
  const { email } = req.body

  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' })

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    // Por segurança, não revela se o e-mail existe ou não — sempre responde 200
    if (!user) {
      return res.json({ message: 'Se o e-mail existir, um código foi enviado.' })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000)

    await prisma.verificationCode.create({
      data: { email, code, type: 'PASSWORD_RESET', expiresAt },
    })

    await sendPasswordResetCode(email, code)

    return res.json({ message: 'Se o e-mail existir, um código foi enviado.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao processar solicitação' })
  }
}

export async function verifyCode(req, res) {
  const { email, code } = req.body

  if (!email || !code) return res.status(400).json({ error: 'E-mail e código são obrigatórios' })

  const verification = await prisma.verificationCode.findFirst({
    where: { email, code, type: 'PASSWORD_RESET', usedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!verification) {
    return res.status(400).json({ error: 'Código inválido' })
  }

  if (verification.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Código expirado. Solicite um novo.' })
  }

  // Marca como usado e retorna o id como "resetToken" temporário
  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  })

  return res.json({ resetToken: verification.id })
}

export async function resetPassword(req, res) {
  const { resetToken, password } = req.body

  if (!resetToken || !password) {
    return res.status(400).json({ error: 'resetToken e password são obrigatórios' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' })
  }

  const verification = await prisma.verificationCode.findUnique({
    where: { id: resetToken },
  })

  if (!verification || verification.type !== 'PASSWORD_RESET' || !verification.usedAt) {
    return res.status(400).json({ error: 'Token inválido. Refaça o processo de recuperação.' })
  }

  // Token só é válido por 15 minutos após ter sido verificado
  const usedAtPlus15Min = new Date(verification.usedAt.getTime() + 15 * 60 * 1000)
  if (usedAtPlus15Min < new Date()) {
    return res.status(400).json({ error: 'Token expirado. Refaça o processo de recuperação.' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { email: verification.email },
    data: { password: hashedPassword },
  })

  // Limpa os códigos usados desse e-mail
  await prisma.verificationCode.deleteMany({
    where: { email: verification.email, type: 'PASSWORD_RESET' },
  })

  return res.json({ message: 'Senha redefinida com sucesso' })
}

export async function resendCode(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.json({ message: 'Se o e-mail existir, um novo código foi enviado.' })
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000)

  await prisma.verificationCode.create({
    data: { email, code, type: 'PASSWORD_RESET', expiresAt },
  })

  try {
    await sendPasswordResetCode(email, code)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao reenviar e-mail' })
  }

  return res.json({ message: 'Se o e-mail existir, um novo código foi enviado.' })
}
