import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { swaggerSpec, swaggerUi } from './config/swagger.js'

import authRoutes from './routes/auth.routes.js'
import workspaceRoutes from './routes/workspace.routes.js'
import projectRoutes from './routes/project.routes.js'
import requirementRoutes from './routes/requirement.routes.js'
import stakeholderRoutes from './routes/stakeholder.routes.js'
import userStoryRoutes from './routes/userStory.routes.js'
import meetingRoutes from './routes/meeting.routes.js'
import activityRoutes from './routes/activity.routes.js'
import passwordRecoveryRoutes from './routes/passwordRecovery.routes.js'
import emailVerificationRoutes from './routes/emailVerification.routes.js'
import workspaceMemberRoutes from './routes/workspaceMember.routes.js'
import workspaceInviteRoutes from './routes/workspaceInvite.routes.js'

const app = express()
const PORT = process.env.PORT || 3333

app.use(cors())
app.use(express.json())

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get('/api/swagger.json', (req, res) => {
  res.json(swaggerSpec)
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/workspaces', workspaceRoutes)
app.use('/api/workspaces', projectRoutes)
app.use('/api/projects', requirementRoutes)
app.use('/api/projects', stakeholderRoutes)
app.use('/api/projects', userStoryRoutes)
app.use('/api/projects', meetingRoutes)
app.use('/api/projects', activityRoutes)
app.use('/api/password-recovery', passwordRecoveryRoutes)
app.use('/api/email-verification', emailVerificationRoutes)
app.use('/api/workspaces', workspaceMemberRoutes)
app.use('/api/workspace-invites', workspaceInviteRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 para rotas não mapeadas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' })
})

// Tratamento de erros centralizado — toda rejeição vinda dos controllers (via
// asyncHandler) cai aqui em vez de derrubar o processo ou deixar a requisição
// pendurada sem resposta.
app.use((err, req, res, next) => {
  console.error(err)

  if (err.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado' })
  if (err.code === 'P2002') return res.status(409).json({ error: 'Já existe um registro com esses dados' })

  res.status(500).json({ error: 'Erro interno do servidor' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📖 Swagger docs at http://localhost:${PORT}/api/docs`)
})
