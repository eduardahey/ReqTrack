import { prisma } from '../lib/prisma.js'

const participantSummary = { select: { id: true, name: true, department: true } }

function serialize(meeting) {
  return { ...meeting, tags: meeting.tags ? JSON.parse(meeting.tags) : [] }
}

export async function listMeetings(req, res) {
  const meetings = await prisma.meeting.findMany({
    where: { projectId: req.params.projectId },
    include: { participants: participantSummary },
    orderBy: { date: 'desc' },
  })
  res.json(meetings.map(serialize))
}

export async function createMeeting(req, res) {
  const { title, date, summary, points, decisions, tags, participantIds } = req.body
  if (!title || !date) return res.status(400).json({ error: 'Título e data são obrigatórios' })

  const meeting = await prisma.meeting.create({
    data: {
      title, date: new Date(date), summary, points, decisions,
      tags: tags?.length ? JSON.stringify(tags) : null,
      participants: participantIds?.length ? { connect: participantIds.map((id) => ({ id })) } : undefined,
      projectId: req.params.projectId,
    },
    include: { participants: participantSummary },
  })

  await prisma.activity.create({
    data: {
      type: 'MEETING_LOGGED',
      title: 'Reunião Registrada',
      description: `${title} — ${new Date(date).toLocaleDateString('pt-BR')}.`,
      projectId: req.params.projectId,
    },
  })

  res.status(201).json(serialize(meeting))
}

export async function updateMeeting(req, res) {
  const { tags, participantIds, ...data } = req.body
  if (data.date) data.date = new Date(data.date)
  if (tags !== undefined) data.tags = tags?.length ? JSON.stringify(tags) : null
  if (participantIds) data.participants = { set: participantIds.map((id) => ({ id })) }

  const meeting = await prisma.meeting.update({
    where: { id: req.params.id },
    data,
    include: { participants: participantSummary },
  })
  res.json(serialize(meeting))
}

export async function deleteMeeting(req, res) {
  await prisma.meeting.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
