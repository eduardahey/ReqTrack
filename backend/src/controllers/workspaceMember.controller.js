import { prisma } from '../lib/prisma.js'
import { sendWorkspaceInviteCode, sendWorkspaceAddedNotification } from '../services/email.service.js'

const CODE_EXPIRATION_MINUTES = 30

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function requireAdmin(req, res, workspaceId) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId } },
  })
  if (!member) {
    res.status(403).json({ error: 'Acesso negado' })
    return null
  }
  if (member.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas administradores podem gerenciar participantes' })
    return null
  }
  return member
}

export async function listMembers(req, res) {
  const { workspaceId } = req.params
  if (!(await requireAdmin(req, res, workspaceId))) return

  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  res.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      isOwner: m.isOwner,
      createdAt: m.createdAt,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
    invites: invites.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt, createdAt: i.createdAt })),
  })
}

export async function updateMember(req, res) {
  const { workspaceId, memberId } = req.params
  const { role } = req.body
  if (!(await requireAdmin(req, res, workspaceId))) return
  if (role !== 'ADMIN' && role !== 'MEMBER') return res.status(400).json({ error: 'Cargo inválido' })

  const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } })
  if (!target || target.workspaceId !== workspaceId) return res.status(404).json({ error: 'Participante não encontrado' })

  if (target.isOwner && role !== 'ADMIN') {
    return res.status(400).json({ error: 'Não é possível alterar o cargo do usuário que criou o workspace' })
  }

  if (target.role === 'ADMIN' && role === 'MEMBER') {
    const adminCount = await prisma.workspaceMember.count({ where: { workspaceId, role: 'ADMIN' } })
    if (adminCount <= 1) return res.status(400).json({ error: 'O workspace precisa de ao menos um administrador' })
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  res.json({ id: updated.id, role: updated.role, isOwner: updated.isOwner, userId: updated.user.id, name: updated.user.name, email: updated.user.email })
}

export async function deleteMember(req, res) {
  const { workspaceId, memberId } = req.params
  if (!(await requireAdmin(req, res, workspaceId))) return

  const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } })
  if (!target || target.workspaceId !== workspaceId) return res.status(404).json({ error: 'Participante não encontrado' })

  if (target.isOwner) {
    return res.status(400).json({ error: 'Não é possível remover o usuário que criou o workspace' })
  }

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.workspaceMember.count({ where: { workspaceId, role: 'ADMIN' } })
    if (adminCount <= 1) return res.status(400).json({ error: 'O workspace precisa de ao menos um administrador' })
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } })
  res.status(204).send()
}

export async function createInvite(req, res) {
  const { workspaceId } = req.params
  const { email, role } = req.body
  if (!(await requireAdmin(req, res, workspaceId))) return
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' })
  const memberRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER'

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
    })
    if (alreadyMember) return res.status(409).json({ error: 'Este e-mail já é participante do workspace' })

    const member = await prisma.workspaceMember.create({
      data: { userId: existingUser.id, workspaceId, role: memberRole },
    })

    try {
      await sendWorkspaceAddedNotification(email, workspace.name, memberRole)
    } catch (err) {
      console.error(err)
    }

    return res.status(201).json({
      type: 'member',
      id: member.id, role: member.role, userId: existingUser.id, name: existingUser.name, email: existingUser.email,
    })
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000)

  const invite = await prisma.workspaceInvite.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    create: { email, role: memberRole, code, expiresAt, workspaceId },
    update: { role: memberRole, code, expiresAt },
  })

  try {
    await sendWorkspaceInviteCode(email, workspace.name, code)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao enviar e-mail de convite' })
  }

  res.status(201).json({ type: 'invite', id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt })
}

export async function resendInvite(req, res) {
  const { workspaceId, inviteId } = req.params
  if (!(await requireAdmin(req, res, workspaceId))) return

  const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } })
  if (!invite || invite.workspaceId !== workspaceId) return res.status(404).json({ error: 'Convite não encontrado' })

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000)

  await prisma.workspaceInvite.update({ where: { id: inviteId }, data: { code, expiresAt } })

  try {
    await sendWorkspaceInviteCode(invite.email, workspace.name, code)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao enviar e-mail de convite' })
  }

  res.json({ message: 'Convite reenviado' })
}

export async function cancelInvite(req, res) {
  const { workspaceId, inviteId } = req.params
  if (!(await requireAdmin(req, res, workspaceId))) return

  const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } })
  if (!invite || invite.workspaceId !== workspaceId) return res.status(404).json({ error: 'Convite não encontrado' })

  await prisma.workspaceInvite.delete({ where: { id: inviteId } })
  res.status(204).send()
}
