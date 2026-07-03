import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as workspaceController from '../controllers/workspace.controller.js'

const { listWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace } = wrapControllers(workspaceController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: Gerenciamento de workspaces
 */

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Lista workspaces do usuário autenticado
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: Lista de workspaces
 */
router.get('/', authenticate, listWorkspaces)

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     summary: Retorna um workspace pelo ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace encontrado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Workspace não encontrado
 */
router.get('/:id', authenticate, getWorkspace)

/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: Atualiza nome ou descrição do workspace
 *     tags: [Workspaces]
 *     parameters:
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
 *         description: Workspace atualizado
 *       403:
 *         description: Acesso negado ou usuário não é ADMIN
 *       404:
 *         description: Workspace não encontrado
 */
router.put('/:id', authenticate, updateWorkspace)

/**
 * @swagger
 * /api/workspaces/{id}:
 *   delete:
 *     summary: Remove um workspace
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Workspace removido
 *       403:
 *         description: Acesso negado ou usuário não é ADMIN
 */
router.delete('/:id', authenticate, deleteWorkspace)

export default router
