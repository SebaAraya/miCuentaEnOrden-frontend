import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Registra un nuevo usuario
 * @access Public (o Admin para crear roles especiales)
 */
router.post('/register', optionalAuth, authController.register);

/**
 * @route POST /api/v1/auth/login
 * @desc Inicia sesión de usuario
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresca el access token usando refresh token
 * @access Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @desc Cierra sesión del usuario (revoca refresh token)
 * @access Public
 */
router.post('/logout', authController.logout);

/**
 * @route POST /api/v1/auth/logout-all
 * @desc Cierra todas las sesiones del usuario
 * @access Private
 */
router.post('/logout-all', authenticateToken, authController.logoutAll);

/**
 * @route GET /api/v1/auth/me
 * @desc Obtiene información del usuario actual
 * @access Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route PUT /api/v1/auth/me
 * @desc Actualiza información del usuario actual
 * @access Private
 */
router.put('/me', authenticateToken, authController.updateCurrentUser);

/**
 * @route POST /api/v1/auth/cleanup-tokens
 * @desc Limpia tokens expirados (solo admins)
 * @access Private (Admin only)
 */
router.post('/cleanup-tokens', 
  authenticateToken, 
  requireRole(UserRole.ADMIN), 
  authController.cleanupTokens
);

export default router; 