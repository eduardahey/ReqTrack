import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as workspaceMemberController from '../controllers/workspaceMember.controller.js'

const {
  listMembers,
  updateMember,
  deleteMember,
  createInvite,
  resendInvite,
  cancelInvite,
} = wrapControllers(workspaceMemberController)

const router = Router({ mergeParams: true })

/**
 * @swagger
 * tags:
 *   name: WorkspaceMembers
 *   description: Gerenciamento de participantes do workspace
 */

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members:
 *   get:
 *     summary: Lista participantes e convites pendentes do workspace (apenas ADMIN)
 *     tags: [WorkspaceMembers]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de membros e convites pendentes
 *       403:
 *         description: Acesso negado
 */
router.get('/:workspaceId/members', authenticate, listMembers)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members/{memberId}:
 *   put:
 *     summary: Atualiza o cargo de um participante (apenas ADMIN)
 *     tags: [WorkspaceMembers]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
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
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *     responses:
 *       200:
 *         description: Participante atualizado
 *       400:
 *         description: Não é possível remover o último administrador
 *       403:
 *         description: Acesso negado
 */
router.put('/:workspaceId/members/:memberId', authenticate, updateMember)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members/{memberId}:
 *   delete:
 *     summary: Remove um participante do workspace (apenas ADMIN)
 *     tags: [WorkspaceMembers]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Participante removido
 *       400:
 *         description: Não é possível remover o último administrador
 *       403:
 *         description: Acesso negado
 */
router.delete('/:workspaceId/members/:memberId', authenticate, deleteMember)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/invites:
 *   post:
 *     summary: Convida um participante por e-mail (apenas ADMIN)
 *     tags: [WorkspaceMembers]
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
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *     responses:
 *       201:
 *         description: Convite criado ou participante adicionado diretamente
 *       403:
 *         description: Acesso negado
 *       409:
 *         description: E-mail já é participante do workspace
 */
router.post('/:workspaceId/invites', authenticate, createInvite)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/invites/{inviteId}/resend:
 *   post:
 *     summary: Reenvia o código de convite (apenas ADMIN)
 *     tags: [WorkspaceMembers]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Convite reenviado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Convite não encontrado
 */
router.post('/:workspaceId/invites/:inviteId/resend', authenticate, resendInvite)

/**
 * @swagger
 * /api/workspaces/{workspaceId}/invites/{inviteId}:
 *   delete:
 *     summary: Cancela um convite pendente (apenas ADMIN)
 *     tags: [WorkspaceMembers]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Convite cancelado
 *       403:
 *         description: Acesso negado
 */
router.delete('/:workspaceId/invites/:inviteId', authenticate, cancelInvite)

export default router
