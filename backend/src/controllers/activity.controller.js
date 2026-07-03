import { prisma } from '../lib/prisma.js'

export async function listActivities(req, res) {
  const limit = req.query.limit ? Number(req.query.limit) : 20

  const activities = await prisma.activity.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(activities)
}
