import { prisma } from '../lib/prisma.js'

const requirementSummary = { select: { id: true, title: true, prerequisites: { select: { id: true, title: true } } } }

function withInheritedPrerequisites(story) {
  const seen = new Map()
  for (const requirement of story.requirements || []) {
    for (const prerequisite of requirement.prerequisites || []) {
      seen.set(prerequisite.id, prerequisite)
    }
  }
  return {
    ...story,
    requirements: (story.requirements || []).map(({ prerequisites, ...requirement }) => requirement),
    inheritedPrerequisites: Array.from(seen.values()),
  }
}

export async function listUserStories(req, res) {
  const { priority, status } = req.query
  const where = { projectId: req.params.projectId }
  if (priority) where.priority = priority
  if (status) where.status = status

  const stories = await prisma.userStory.findMany({
    where,
    include: {
      requirements: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  })
  res.json(stories.map(withInheritedPrerequisites))
}

export async function getUserStory(req, res) {
  const { projectId, id } = req.params

  const story = await prisma.userStory.findFirst({
    where: { id, projectId },
    include: {
      requirements: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
  })

  if (!story) return res.status(404).json({ error: 'História não encontrada' })

  res.json(withInheritedPrerequisites(story))
}

export async function createUserStory(req, res) {
  const { userType, feature, benefit, acceptanceCriteria, priority, status, requirementIds } = req.body
  if (!userType || !feature || !benefit)
    return res.status(400).json({ error: 'userType, feature e benefit são obrigatórios' })

  const story = await prisma.userStory.create({
    data: {
      userType, feature, benefit, priority, status,
      projectId: req.params.projectId,
      acceptanceCriteria: {
        create: (acceptanceCriteria || [])
          .map((text) => (typeof text === 'string' ? text : text?.text))
          .filter((text) => text?.trim())
          .map((text, order) => ({ text, order })),
      },
      requirements: requirementIds?.length ? { connect: requirementIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      requirements: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
  })
  res.status(201).json(withInheritedPrerequisites(story))
}

export async function updateUserStory(req, res) {
  const { id } = req.params
  const { acceptanceCriteria, requirementIds, ...data } = req.body

  if (acceptanceCriteria) {
    await prisma.acceptanceCriterion.deleteMany({ where: { userStoryId: id } })
    data.acceptanceCriteria = {
      create: acceptanceCriteria
        .map((text) => (typeof text === 'string' ? text : text?.text))
        .filter((text) => text?.trim())
        .map((text, order) => ({ text, order })),
    }
  }
  if (requirementIds) data.requirements = { set: requirementIds.map((reqId) => ({ id: reqId })) }

  const story = await prisma.userStory.update({
    where: { id },
    data,
    include: {
      requirements: requirementSummary,
      acceptanceCriteria: { orderBy: { order: 'asc' } },
    },
  })
  res.json(withInheritedPrerequisites(story))
}

export async function toggleAcceptanceCriterion(req, res) {
  const { id, criterionId } = req.params
  const { done } = req.body

  const criterion = await prisma.acceptanceCriterion.updateMany({
    where: { id: criterionId, userStoryId: id },
    data: { done: !!done },
  })

  if (criterion.count === 0) return res.status(404).json({ error: 'Critério não encontrado' })

  res.json({ id: criterionId, done: !!done })
}

export async function deleteUserStory(req, res) {
  await prisma.userStory.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
