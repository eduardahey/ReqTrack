import { prisma } from '../lib/prisma.js'
import { asyncHandler } from './asyncHandler.js'

export const requireProjectAccess = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return res.status(404).json({ error: 'Projeto não encontrado' })

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.user.userId, workspaceId: project.workspaceId } },
  })
  if (!member) return res.status(403).json({ error: 'Acesso negado' })

  req.projectMembership = member
  next()
})
