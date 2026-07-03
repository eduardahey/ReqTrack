import { Router } from 'express'
import { wrapControllers } from '../middlewares/asyncHandler.js'
import * as passwordRecoveryController from '../controllers/passwordRecovery.controller.js'

const { requestReset, verifyCode, resetPassword, resendCode } = wrapControllers(passwordRecoveryController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: PasswordRecovery
 *   description: Recuperação de senha via código por e-mail
 */

/**
 * @swagger
 * /api/password-recovery/request:
 *   post:
 *     summary: Solicita um código de recuperação de senha por e-mail
 *     tags: [PasswordRecovery]
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
 *                 example: usuario@empresa.com
 *     responses:
 *       200:
 *         description: Código enviado (sempre retorna 200 mesmo se o e-mail não existir, por segurança)
 *       500:
 *         description: Erro ao enviar e-mail
 */
router.post('/request', requestReset)

/**
 * @swagger
 * /api/password-recovery/verify:
 *   post:
 *     summary: Verifica o código de recuperação de senha
 *     tags: [PasswordRecovery]
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
 *         description: Código válido, retorna um resetToken temporário
 *       400:
 *         description: Código inválido ou expirado
 */
router.post('/verify', verifyCode)

/**
 * @swagger
 * /api/password-recovery/reset:
 *   post:
 *     summary: Redefine a senha usando o resetToken obtido na verificação
 *     tags: [PasswordRecovery]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resetToken, password]
 *             properties:
 *               resetToken:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.post('/reset', resetPassword)

/**
 * @swagger
 * /api/password-recovery/resend:
 *   post:
 *     summary: Reenvia o código de recuperação de senha
 *     tags: [PasswordRecovery]
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
 */
router.post('/resend', resendCode)

export default router
