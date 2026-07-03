import { prisma } from '../lib/prisma.js'

const userStorySummary = { select: { id: true, userType: true, feature: true, benefit: true, status: true } }
const requirementSummary = { select: { id: true, title: true } }

export async function listRequirements(req, res) {
  const { projectId } = req.params
  const { type, priority, status } = req.query

  const where = { projectId }
  if (type) where.type = type
  if (priority) where.priority = priority
  if (status) where.status = status

  const requirements = await prisma.requirement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  res.json(requirements)
}

export async function getRequirement(req, res) {
  const { projectId, id } = req.params

  const requirement = await prisma.requirement.findFirst({
    where: { id, projectId },
    include: {
      userStories: userStorySummary,
      prerequisites: requirementSummary,
      requiredBy: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
  })

  if (!requirement) return res.status(404).json({ error: 'Requisito não encontrado' })

  res.json(requirement)
}

export async function createRequirement(req, res) {
  const { projectId } = req.params
  const { title, description, type, priority, status, actor, acceptanceCriteria, category, userStoryIds, prerequisiteIds } = req.body

  if (!title || !type) return res.status(400).json({ error: 'Título e tipo são obrigatórios' })

  const requirement = await prisma.requirement.create({
    data: {
      title, description, type, priority, status, actor, category, projectId,
      acceptanceCriteria: {
        create: (acceptanceCriteria || [])
          .map((text) => (typeof text === 'string' ? text : text?.text))
          .filter((text) => text?.trim())
          .map((text, order) => ({ text, order })),
      },
      userStories: userStoryIds?.length ? { connect: userStoryIds.map((id) => ({ id })) } : undefined,
      prerequisites: prerequisiteIds?.length ? { connect: prerequisiteIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      userStories: userStorySummary,
      prerequisites: requirementSummary,
      requiredBy: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
  })

  res.status(201).json(requirement)
}

export async function updateRequirement(req, res) {
  const { id } = req.params
  const { acceptanceCriteria, userStoryIds, prerequisiteIds, ...data } = req.body

  if (acceptanceCriteria) {
    await prisma.acceptanceCriterion.deleteMany({ where: { requirementId: id } })
    data.acceptanceCriteria = {
      create: acceptanceCriteria
        .map((text) => (typeof text === 'string' ? text : text?.text))
        .filter((text) => text?.trim())
        .map((text, order) => ({ text, order })),
    }
  }
  if (userStoryIds) data.userStories = { set: userStoryIds.map((storyId) => ({ id: storyId })) }
  if (prerequisiteIds) data.prerequisites = { set: prerequisiteIds.map((reqId) => ({ id: reqId })) }

  const requirement = await prisma.requirement.update({
    where: { id },
    data,
    include: {
      userStories: userStorySummary,
      prerequisites: requirementSummary,
      requiredBy: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
  })
  res.json(requirement)
}

export async function toggleAcceptanceCriterion(req, res) {
  const { id, criterionId } = req.params
  const { done } = req.body

  const criterion = await prisma.acceptanceCriterion.updateMany({
    where: { id: criterionId, requirementId: id },
    data: { done: !!done },
  })

  if (criterion.count === 0) return res.status(404).json({ error: 'Critério não encontrado' })

  res.json({ id: criterionId, done: !!done })
}

export async function deleteRequirement(req, res) {
  const { id } = req.params
  await prisma.requirement.delete({ where: { id } })
  res.status(204).send()
}
