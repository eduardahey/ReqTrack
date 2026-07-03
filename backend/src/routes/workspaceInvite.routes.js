import { Router } from 'express'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as workspaceInviteController from '../controllers/workspaceInvite.controller.js'

const { lookupInvite, acceptInvite } = wrapControllers(workspaceInviteController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: WorkspaceInvites
 *   description: Aceite de convites de workspace (público)
 */

/**
 * @swagger
 * /api/workspace-invites/lookup:
 *   post:
 *     summary: Verifica um convite pendente pelo e-mail e código
 *     tags: [WorkspaceInvites]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Convite válido
 *       400:
 *         description: Código inválido ou expirado
 *       404:
 *         description: Convite não encontrado
 */
router.post('/lookup', lookupInvite)

/**
 * @swagger
 * /api/workspace-invites/accept:
 *   post:
 *     summary: Aceita um convite, criando a conta e vinculando ao workspace
 *     tags: [WorkspaceInvites]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, name, password]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conta criada e convite aceito, retorna token de autenticação
 *       400:
 *         description: Código inválido ou expirado
 *       404:
 *         description: Convite não encontrado
 *       409:
 *         description: Já existe uma conta com esse e-mail
 */
router.post('/accept', acceptInvite)

export default router
