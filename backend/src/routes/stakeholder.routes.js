import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireProjectAccess } from '../middlewares/projectAccess.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as stakeholderController from '../controllers/stakeholder.controller.js'

const {
  listStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
} = wrapControllers(stakeholderController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Stakeholders
 *   description: Gerenciamento de stakeholders
 */

/**
 * @swagger
 * /api/projects/{projectId}/stakeholders:
 *   get:
 *     summary: Lista stakeholders do projeto
 *     tags: [Stakeholders]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de stakeholders
 */
router.get('/:projectId/stakeholders', authenticate, requireProjectAccess, listStakeholders)

/**
 * @swagger
 * /api/projects/{projectId}/stakeholders:
 *   post:
 *     summary: Cria um stakeholder
 *     tags: [Stakeholders]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               power:
 *                 type: integer
 *               interest:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Stakeholder criado
 */
router.post('/:projectId/stakeholders', authenticate, requireProjectAccess, createStakeholder)

/**
 * @swagger
 * /api/projects/{projectId}/stakeholders/{id}:
 *   put:
 *     summary: Atualiza um stakeholder
 *     tags: [Stakeholders]
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
 *         description: Stakeholder atualizado
 */
router.put('/:projectId/stakeholders/:id', authenticate, requireProjectAccess, updateStakeholder)

/**
 * @swagger
 * /api/projects/{projectId}/stakeholders/{id}:
 *   delete:
 *     summary: Remove um stakeholder
 *     tags: [Stakeholders]
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
 *         description: Stakeholder removido
 */
router.delete('/:projectId/stakeholders/:id', authenticate, requireProjectAccess, deleteStakeholder)

export default router
