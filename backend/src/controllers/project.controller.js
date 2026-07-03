import { prisma } from '../lib/prisma.js'

export async function listProjects(req, res) {
  const { workspaceId } = req.params

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId } },
  })
  if (!member) return res.status(403).json({ error: 'Acesso negado' })

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { requirements: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(projects)
}

export async function createProject(req, res) {
  const { workspaceId } = req.params
  const { name, description } = req.body

  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId } },
  })
  if (!member) return res.status(403).json({ error: 'Acesso negado' })

  const project = await prisma.project.create({
    data: { name, description, workspaceId },
  })

  res.status(201).json(project)
}

export async function deleteProject(req, res) {
  const { workspaceId, id } = req.params

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId } },
  })
  if (!member || member.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' })

  await prisma.project.delete({ where: { id } })
  res.status(204).send()
}

export async function updateProject(req, res) {
  const { workspaceId, id } = req.params
  const { name, description } = req.body

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId } },
  })
  if (!member) return res.status(403).json({ error: 'Acesso negado' })
  if (member.role !== 'ADMIN') return res.status(403).json({ error: 'Apenas administradores podem editar o projeto' })

  const project = await prisma.project.update({
    where: { id },
    data: { name, description },
  })

  res.json(project)
}
