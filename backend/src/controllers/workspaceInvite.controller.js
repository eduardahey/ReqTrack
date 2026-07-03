import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

export async function lookupInvite(req, res) {
  const { email, code } = req.body
  if (!email || !code) return res.status(400).json({ error: 'E-mail e código são obrigatórios' })

  const invite = await prisma.workspaceInvite.findFirst({
    where: { email, code },
    include: { workspace: { select: { name: true } } },
  })

  if (!invite) return res.status(404).json({ error: 'Convite não encontrado' })
  if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Convite expirado. Peça para reenviarem.' })

  res.json({ email: invite.email, workspaceName: invite.workspace.name, role: invite.role })
}

export async function acceptInvite(req, res) {
  const { email, code, name, password } = req.body
  if (!email || !code || !name || !password) {
    return res.status(400).json({ error: 'Nome, e-mail, código e senha são obrigatórios' })
  }

  const invite = await prisma.workspaceInvite.findFirst({
    where: { email, code },
    include: { workspace: true },
  })

  if (!invite) return res.status(404).json({ error: 'Convite não encontrado' })
  if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Convite expirado. Peça para reenviarem.' })

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) return res.status(409).json({ error: 'Já existe uma conta com esse e-mail. Faça login normalmente.' })

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { name, email, password: hashedPassword },
    })
    await tx.workspaceMember.create({
      data: { userId: createdUser.id, workspaceId: invite.workspaceId, role: invite.role },
    })
    await tx.workspaceInvite.delete({ where: { id: invite.id } })
    return createdUser
  })

  const token = generateToken(user.id)

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
    workspaces: [{ id: invite.workspace.id, name: invite.workspace.name, role: invite.role }],
  })
}
