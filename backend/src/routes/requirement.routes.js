import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireProjectAccess } from '../middlewares/projectAccess.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as requirementController from '../controllers/requirement.controller.js'

const {
  listRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  toggleAcceptanceCriterion,
  deleteRequirement,
} = wrapControllers(requirementController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Requirements
 *   description: Gerenciamento de requisitos
 */

/**
 * @swagger
 * /api/projects/{projectId}/requirements:
 *   get:
 *     summary: Lista requisitos do projeto
 *     tags: [Requirements]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [FUNCTIONAL, NON_FUNCTIONAL]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, DONE]
 *     responses:
 *       200:
 *         description: Lista de requisitos
 */
router.get('/:projectId/requirements', authenticate, requireProjectAccess, listRequirements)

/**
 * @swagger
 * /api/projects/{projectId}/requirements/{id}:
 *   get:
 *     summary: Obtém um requisito pelo id
 *     tags: [Requirements]
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
 *         description: Requisito encontrado
 *       404:
 *         description: Requisito não encontrado
 */
router.get('/:projectId/requirements/:id', authenticate, requireProjectAccess, getRequirement)

/**
 * @swagger
 * /api/projects/{projectId}/requirements:
 *   post:
 *     summary: Cria um requisito no projeto
 *     tags: [Requirements]
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
 *             required: [title, type]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [FUNCTIONAL, NON_FUNCTIONAL]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, DONE]
 *               actor:
 *                 type: string
 *               acceptanceCriteria:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               userStoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               prerequisiteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Requisito criado
 */
router.post('/:projectId/requirements', authenticate, requireProjectAccess, createRequirement)

/**
 * @swagger
 * /api/projects/{projectId}/requirements/{id}:
 *   put:
 *     summary: Atualiza um requisito
 *     tags: [Requirements]
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
 *         description: Requisito atualizado
 */
router.put('/:projectId/requirements/:id', authenticate, requireProjectAccess, updateRequirement)

/**
 * @swagger
 * /api/projects/{projectId}/requirements/{id}/acceptance-criteria/{criterionId}:
 *   patch:
 *     summary: Marca/desmarca um critério de aceitação do requisito
 *     tags: [Requirements]
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
router.patch('/:projectId/requirements/:id/acceptance-criteria/:criterionId', authenticate, requireProjectAccess, toggleAcceptanceCriterion)

/**
 * @swagger
 * /api/projects/{projectId}/requirements/{id}:
 *   delete:
 *     summary: Remove um requisito
 *     tags: [Requirements]
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
 *         description: Requisito removido
 */
router.delete('/:projectId/requirements/:id', authenticate, requireProjectAccess, deleteRequirement)

export default router
