import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { wrapControllers } from '../middlewares/asyncHandler.js'

const { registerWorkspace, login, updateProfile } = wrapControllers(authController)

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e criação de workspace
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Cria um workspace e o usuário administrador
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workspaceName, name, email, password]
 *             properties:
 *               workspaceName:
 *                 type: string
 *                 example: Minha Empresa
 *               workspaceDescription:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@empresa.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Workspace criado com sucesso
 *       400:
 *         description: Campos obrigatórios faltando
 *       409:
 *         description: E-mail já cadastrado
 */
router.post('/register', registerWorkspace)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao@empresa.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', login)

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Atualiza o perfil do usuário autenticado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       400:
 *         description: Dados inválidos ou senha atual incorreta
 *       409:
 *         description: E-mail já está em uso
 */
router.put('/me', authenticate, updateProfile)

export default router
