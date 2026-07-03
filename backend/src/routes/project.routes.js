import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as projectController from '../controllers/project.controller.js'

const { listProjects, createProject, deleteProject, updateProject } = wrapControllers(projectController)

const router = Router({ mergeParams: true })

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Gerenciamento de projetos
 */

/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects:
 *   get:
 *     summary: Lista projetos do workspace
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de projetos
 */
router.get('/:workspaceId/projects', authenticate, listProjects)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects:
 *   post:
 *     summary: Cria um projeto no workspace
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Projeto criado
 */
router.post('/:workspaceId/projects', authenticate, createProject)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects/{id}:
 *   delete:
 *     summary: Remove um projeto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
 *         description: Projeto removido
 */
router.delete('/:workspaceId/projects/:id', authenticate, deleteProject)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects/{id}:
 *   put:
 *     summary: Atualiza um projeto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Projeto atualizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Projeto não encontrado
 */
router.put('/:workspaceId/projects/:id', authenticate, updateProject)

export default router
