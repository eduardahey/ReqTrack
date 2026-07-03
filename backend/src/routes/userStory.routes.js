import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireProjectAccess } from '../middlewares/projectAccess.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as userStoryController from '../controllers/userStory.controller.js'

const {
  listUserStories,
  getUserStory,
  createUserStory,
  updateUserStory,
  toggleAcceptanceCriterion,
  deleteUserStory,
} = wrapControllers(userStoryController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: UserStories
 *   description: Histórias de usuário e backlog
 */

/**
 * @swagger
 * /api/projects/{projectId}/user-stories:
 *   get:
 *     summary: Lista histórias de usuário do projeto
 *     tags: [UserStories]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de histórias
 */
router.get('/:projectId/user-stories', authenticate, requireProjectAccess, listUserStories)

/**
 * @swagger
 * /api/projects/{projectId}/user-stories/{id}:
 *   get:
 *     summary: Obtém uma história de usuário pelo id
 *     tags: [UserStories]
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
 *       200:
 *         description: História encontrada
 *       404:
 *         description: História não encontrada
 */
router.get('/:projectId/user-stories/:id', authenticate, requireProjectAccess, getUserStory)

/**
 * @swagger
 * /api/projects/{projectId}/user-stories:
 *   post:
 *     summary: Cria uma história de usuário
 *     tags: [UserStories]
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
 *             required: [userType, feature, benefit]
 *             properties:
 *               userType:
 *                 type: string
 *               feature:
 *                 type: string
 *               benefit:
 *                 type: string
 *               acceptanceCriteria:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *               requirementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: História criada
 */
router.post('/:projectId/user-stories', authenticate, requireProjectAccess, createUserStory)

/**
 * @swagger
 * /api/projects/{projectId}/user-stories/{id}:
 *   put:
 *     summary: Atualiza uma história de usuário
 *     tags: [UserStories]
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
 *         description: História atualizada
 */
router.put('/:projectId/user-stories/:id', authenticate, requireProjectAccess, updateUserStory)

/**
 * @swagger
 * /api/projects/{projectId}/user-stories/{id}/acceptance-criteria/{criterionId}:
 *   patch:
 *     summary: Marca/desmarca um critério de aceitação da história
 *     tags: [UserStories]
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
 *       - in: path
 *         name: criterionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               done:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Critério atualizado
 */
router.patch('/:projectId/user-stories/:id/acceptance-criteria/:criterionId', authenticate, requireProjectAccess, toggleAcceptanceCriterion)

/**
 * @swagger
 * /api/projects/{projectId}/user-stories/{id}:
 *   delete:
 *     summary: Remove uma história de usuário
 *     tags: [UserStories]
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
 *         description: História removida
 */
router.delete('/:projectId/user-stories/:id', authenticate, requireProjectAccess, deleteUserStory)

export default router
