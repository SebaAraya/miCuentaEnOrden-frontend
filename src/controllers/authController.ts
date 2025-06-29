import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { LoginRequest, CreateUserRequest, ApiResponse } from '../types/index.js';

const authService = new AuthService();

/**
 * Registra un nuevo usuario
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const userData: CreateUserRequest = req.body;
    const adminUserId = req.user?.userId; // Si está autenticado como admin

    // Validar datos requeridos
    if (!userData.email || !userData.password || !userData.name) {
      res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Email, contraseña y nombre son requeridos',
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    const result = await authService.register(userData, adminUserId);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado exitosamente',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Error en el registro',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Inicia sesión de usuario
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const loginData: LoginRequest = req.body;
    const deviceInfo = req.headers['user-agent'] || 'Unknown device';

    // Validar datos requeridos
    if (!loginData.email || !loginData.password) {
      res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Email y contraseña son requeridos',
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    const result = await authService.login(loginData, deviceInfo);

    res.json({
      success: true,
      data: result,
      message: 'Inicio de sesión exitoso',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Error en el login',
      message: error instanceof Error ? error.message : 'Credenciales inválidas',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Refresca el access token
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requerido',
        message: 'Debes proporcionar un refresh token válido',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
      message: 'Token refrescado exitosamente',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Error al refrescar token',
      message: error instanceof Error ? error.message : 'Refresh token inválido',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Cierra sesión del usuario
 */
export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    // Incluso si hay error, consideramos el logout exitoso
    res.json({
      success: true,
      message: 'Sesión cerrada',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Cierra todas las sesiones del usuario
 */
export async function logoutAll(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para realizar esta acción',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    await authService.logoutAll(req.user.userId);

    res.json({
      success: true,
      message: 'Todas las sesiones han sido cerradas',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno',
      message: 'No se pudieron cerrar todas las sesiones',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Obtiene información del usuario actual
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a esta información',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const user = await authService.getCurrentUser(req.user.userId);

    res.json({
      success: true,
      data: user,
      message: 'Información del usuario obtenida exitosamente',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Usuario no encontrado',
      message: error instanceof Error ? error.message : 'No se pudo obtener la información del usuario',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Actualiza información del usuario actual
 */
export async function updateCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para actualizar tu información',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const updateData = req.body;
    const updatedUser = await authService.updateUser(req.user.userId, updateData, req.user.userId);

    res.json({
      success: true,
      data: updatedUser,
      message: 'Información actualizada exitosamente',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Error al actualizar',
      message: error instanceof Error ? error.message : 'No se pudo actualizar la información',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
}

/**
 * Endpoint para limpiar tokens expirados (solo para admins)
 */
export async function cleanupTokens(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'Solo los administradores pueden realizar esta acción',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const deletedCount = await authService.cleanupExpiredTokens();

    res.json({
      success: true,
      data: { deletedTokens: deletedCount },
      message: `Se limpiaron ${deletedCount} tokens expirados`,
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno',
      message: 'No se pudieron limpiar los tokens',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
} 