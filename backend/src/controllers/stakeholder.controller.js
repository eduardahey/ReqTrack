import { prisma } from '../lib/prisma.js'

function serialize(stakeholder) {
  return { ...stakeholder, tags: stakeholder.tags ? JSON.parse(stakeholder.tags) : [] }
}

export async function listStakeholders(req, res) {
  const stakeholders = await prisma.stakeholder.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(stakeholders.map(serialize))
}

export async function createStakeholder(req, res) {
  const { name, role, department, email, phone, notes, tags, power, interest } = req.body
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })

  const stakeholder = await prisma.stakeholder.create({
    data: {
      name, role, department, email, phone, notes,
      tags: tags?.length ? JSON.stringify(tags) : null,
      power: power ?? 5,
      interest: interest ?? 5,
      projectId: req.params.projectId,
    },
  })

  await prisma.activity.create({
    data: {
      type: 'STAKEHOLDER_ADDED',
      title: 'Novo Stakeholder Adicionado',
      description: `${name}${department ? ` do Depto. de ${department}` : ''}.`,
      projectId: req.params.projectId,
    },
  })

  res.status(201).json(serialize(stakeholder))
}

export async function updateStakeholder(req, res) {
  const { tags, ...data } = req.body
  if (tags !== undefined) data.tags = tags?.length ? JSON.stringify(tags) : null

  const stakeholder = await prisma.stakeholder.update({
    where: { id: req.params.id },
    data,
  })
  res.json(serialize(stakeholder))
}

export async function deleteStakeholder(req, res) {
  await prisma.stakeholder.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
