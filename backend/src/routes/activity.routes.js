import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireProjectAccess } from '../middlewares/projectAccess.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as activityController from '../controllers/activity.controller.js'

const { listActivities } = wrapControllers(activityController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Log de atividades do projeto
 */

/**
 * @swagger
 * /api/projects/{projectId}/activities:
 *   get:
 *     summary: Lista atividades recentes do projeto
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de atividades
 */
router.get('/:projectId/activities', authenticate, requireProjectAccess, listActivities)

export default router
