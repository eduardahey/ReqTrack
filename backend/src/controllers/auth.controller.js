import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { sendEmailVerificationCode } from '../services/email.service.js'

const CODE_EXPIRATION_MINUTES = 10

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function registerWorkspace(req, res) {
  const { workspaceName, workspaceDescription, name, email, password } = req.body

  if (!workspaceName || !name || !email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' })
  }

  // Verifica se já existe um usuário com esse e-mail
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return res.status(409).json({ error: 'E-mail já cadastrado' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000)

  // Upsert: se já existe uma pendência com esse e-mail (ex: tentou se registrar
  // antes e não confirmou), substitui pelos dados novos e gera um código novo
  await prisma.pendingRegistration.upsert({
    where: { email },
    create: {
      email,
      code,
      expiresAt,
      workspaceName,
      workspaceDescription,
      name,
      hashedPassword,
    },
    update: {
      code,
      expiresAt,
      workspaceName,
      workspaceDescription,
      name,
      hashedPassword,
    },
  })

  try {
    await sendEmailVerificationCode(email, code)
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação:', error)
    return res.status(500).json({ error: 'Erro ao enviar e-mail de verificação. Tente novamente.' })
  }

  //Nada foi criado no banco ainda — só a pendência
  return res.status(201).json({
    message: 'Verifique seu e-mail para concluir a criação do workspace.',
    email,
  })
}

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaces: {
        include: { workspace: true },
      },
    },
  })

  if (!user) {
    // Pode ser que o usuário tenha uma pendência de registro não confirmada
    const pending = await prisma.pendingRegistration.findUnique({ where: { email } })
    if (pending) {
      return res.status(403).json({
        error: 'Cadastro pendente de confirmação. Verifique seu e-mail.',
        needsVerification: true,
        email,
      })
    }
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const token = generateToken(user.id)

  const workspaces = user.workspaces.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role,
  }))

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
    workspaces,
  })
}

export async function updateProfile(req, res) {
  const { name, email, currentPassword, newPassword } = req.body

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'E-mail já está em uso' })
  }

  const data = { name, email }

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Informe a senha atual para definir uma nova senha' })
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) return res.status(400).json({ error: 'Senha atual incorreta' })
    if (newPassword.length < 6) return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' })
    data.password = await bcrypt.hash(newPassword, 10)
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data })

  return res.json({ user: { id: updated.id, name: updated.name, email: updated.email } })
}