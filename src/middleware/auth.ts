import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AuthTokenPayload, UserRole } from '../types/index.js';
import { prisma } from '../config/database.js';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Middleware de autenticación - verifica que el usuario esté autenticado
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido',
        message: 'Debes proporcionar un token de autenticación válido',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar el token
    const decoded = verifyAccessToken(token);

    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        isActive: true,
        lastLogin: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no válido',
        message: 'El usuario no existe o está inactivo',
        timestamp: new Date().toISOString()
      });
    }

    // Actualizar último login si ha pasado más de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastLogin || user.lastLogin < oneHourAgo) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      message: error instanceof Error ? error.message : 'Token de autenticación inválido',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Middleware de autorización - verifica roles específicos
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso',
        timestamp: new Date().toISOString()
      });
    }

    const userRole = req.user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: `Necesitas uno de estos roles: ${allowedRoles.join(', ')}. Tu rol actual: ${userRole}`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Middleware para verificar que el usuario pertenece a la misma organización
 */
export function requireSameOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado',
      message: 'Debes estar autenticado para acceder a este recurso',
      timestamp: new Date().toISOString()
    });
  }

  // Los admins pueden acceder a cualquier organización
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  // Verificar que el usuario tenga una organización
  if (!req.user.organizationId) {
    return res.status(403).json({
      success: false,
      error: 'Sin organización',
      message: 'Debes pertenecer a una organización para acceder a este recurso',
      timestamp: new Date().toISOString()
    });
  }

  // El organizationId se puede pasar como parámetro o en el body
  const targetOrganizationId = req.params.organizationId || req.body.organizationId;

  if (targetOrganizationId && targetOrganizationId !== req.user.organizationId) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      message: 'No tienes acceso a recursos de esta organización',
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Middleware para verificar que el usuario puede acceder a sus propios recursos o es admin/colaborador
 */
export function requireOwnershipOrRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso',
        timestamp: new Date().toISOString()
      });
    }

    const userRole = req.user.role as UserRole;
    const userId = req.params.userId || req.body.userId;

    // Verificar si el usuario tiene un rol permitido
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Verificar si es el propietario del recurso
    if (userId && userId === req.user.userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      message: 'Solo puedes acceder a tus propios recursos o necesitas permisos especiales',
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * Middleware opcional de autenticación - no falla si no hay token
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next(); // Continuar sin autenticación
    }

    const decoded = verifyAccessToken(token);
    
    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || undefined
      };
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
} 