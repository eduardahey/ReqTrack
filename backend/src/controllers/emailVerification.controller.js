import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { sendEmailVerificationCode } from '../services/email.service.js'

const CODE_EXPIRATION_MINUTES = 10

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

export async function resendVerification(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' })

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } })
  if (!pending) {
    return res.status(404).json({ error: 'Nenhum cadastro pendente encontrado para esse e-mail' })
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000)

  await prisma.pendingRegistration.update({
    where: { email },
    data: { code, expiresAt },
  })

  try {
    await sendEmailVerificationCode(email, code)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao enviar e-mail de verificação' })
  }

  return res.json({ message: 'Código de verificação reenviado' })
}

export async function confirmVerification(req, res) {
  const { email, code } = req.body
  if (!email || !code) return res.status(400).json({ error: 'E-mail e código são obrigatórios' })

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } })

  if (!pending) {
    // Talvez já tenha sido confirmado antes — checa se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Este e-mail já foi confirmado. Faça login normalmente.' })
    }
    return res.status(404).json({ error: 'Nenhum cadastro pendente encontrado. Refaça o registro.' })
  }

  if (pending.code !== code) {
    return res.status(400).json({ error: 'Código inválido' })
  }

  if (pending.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Código expirado. Solicite um novo.' })
  }

  // ✅ Agora sim cria o Workspace + User reais, e remove a pendência —
  // tudo em uma transação para garantir atomicidade
  const [workspace] = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: pending.workspaceName,
        description: pending.workspaceDescription,
        members: {
          create: {
            role: 'ADMIN',
            isOwner: true,
            user: {
              create: {
                name: pending.name,
                email: pending.email,
                password: pending.hashedPassword,
              },
            },
          },
        },
      },
      include: { members: { include: { user: true } } },
    })

    await tx.pendingRegistration.delete({ where: { email } })

    return [ws]
  })

  const user = workspace.members[0].user
  const token = generateToken(user.id)

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
    workspaces: [{ id: workspace.id, name: workspace.name, role: 'ADMIN' }],
  })
}
