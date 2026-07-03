import { prisma } from '../lib/prisma.js'

export async function listWorkspaces(req, res) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.userId },
    include: { workspace: true },
  })

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    description: m.workspace.description,
    role: m.role,
  }))

  res.json(workspaces)
}

export async function getWorkspace(req, res) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId: req.params.id } },
    include: { workspace: true },
  })

  if (!member) return res.status(403).json({ error: 'Acesso negado' })

  res.json({ ...member.workspace, role: member.role })
}

export async function updateWorkspace(req, res) {
  const { id } = req.params
  const { name, description } = req.body

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId: id } },
  })
  if (!member) return res.status(403).json({ error: 'Acesso negado' })
  if (member.role !== 'ADMIN') return res.status(403).json({ error: 'Apenas administradores podem editar o workspace' })

  const workspace = await prisma.workspace.update({
    where: { id },
    data: { name, description },
  })

  res.json(workspace)
}

export async function deleteWorkspace(req, res) {
  const { id } = req.params

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId: id } },
  })

  if (!member) return res.status(403).json({ error: 'Acesso negado' })
  if (member.role !== 'ADMIN') return res.status(403).json({ error: 'Apenas administradores podem excluir o workspace' })

  await prisma.workspace.delete({ where: { id } })

  res.status(204).send()
}
