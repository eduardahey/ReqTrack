import { Router } from 'express'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as emailVerificationController from '../controllers/emailVerification.controller.js'

const { resendVerification, confirmVerification } = wrapControllers(emailVerificationController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: EmailVerification
 *   description: Verificação de e-mail no cadastro
 */

/**
 * @swagger
 * /api/email-verification/send:
 *   post:
 *     summary: Reenvia o código de verificação para um cadastro pendente
 *     tags: [EmailVerification]
 *     security: []
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
 *     responses:
 *       200:
 *         description: Código reenviado
 *       404:
 *         description: Nenhum cadastro pendente encontrado para esse e-mail
 */
router.post('/send', resendVerification)

/**
 * @swagger
 * /api/email-verification/confirm:
 *   post:
 *     summary: Confirma o código e cria de fato o Workspace + Usuário administrador
 *     tags: [EmailVerification]
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
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Workspace e usuário criados, retorna token de autenticação
 *       400:
 *         description: Código inválido ou expirado
 *       404:
 *         description: Nenhum cadastro pendente encontrado para esse e-mail
 *       409:
 *         description: E-mail já foi confirmado anteriormente (conta já existe)
 */
router.post('/confirm', confirmVerification)

export default router
