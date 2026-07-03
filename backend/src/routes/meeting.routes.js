import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireProjectAccess } from '../middlewares/projectAccess.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as meetingController from '../controllers/meeting.controller.js'

const { listMeetings, createMeeting, updateMeeting, deleteMeeting } = wrapControllers(meetingController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Registro de reuniões
 */

/**
 * @swagger
 * /api/projects/{projectId}/meetings:
 *   get:
 *     summary: Lista reuniões do projeto
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de reuniões
 */
router.get('/:projectId/meetings', authenticate, requireProjectAccess, listMeetings)

/**
 * @swagger
 * /api/projects/{projectId}/meetings:
 *   post:
 *     summary: Registra uma reunião
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, date]
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               summary:
 *                 type: string
 *               points:
 *                 type: string
 *               decisions:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Reunião criada
 */
router.post('/:projectId/meetings', authenticate, requireProjectAccess, createMeeting)

/**
 * @swagger
 * /api/projects/{projectId}/meetings/{id}:
 *   put:
 *     summary: Atualiza uma reunião
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Reunião atualizada
 */
router.put('/:projectId/meetings/:id', authenticate, requireProjectAccess, updateMeeting)

/**
 * @swagger
 * /api/projects/{projectId}/meetings/{id}:
 *   delete:
 *     summary: Remove uma reunião
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Reunião removida
 */
router.delete('/:projectId/meetings/:id', authenticate, requireProjectAccess, deleteMeeting)

export default router
