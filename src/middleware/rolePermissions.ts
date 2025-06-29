import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/index.js'
import { UserRole } from '../types/index.js'
import { prisma } from '../config/database.js'

/**
 * Permisos por rol para diferentes recursos
 */
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    organizations: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete', 'change_role'],
    categories: ['create', 'read', 'update', 'delete'],
    transactions: ['create', 'read', 'update', 'delete', 'read_all'],
    budgets: ['create', 'read', 'update', 'delete', 'read_all'],
    reports: ['read_all', 'export']
  },
  [UserRole.COLABORADOR]: {
    organizations: ['read_own', 'update_own'],
    users: ['read_org', 'update_own'],
    categories: ['create', 'read', 'update_own'],
    transactions: ['create', 'read', 'update_own', 'delete_own', 'read_org'],
    budgets: ['create', 'read', 'update_own', 'delete_own', 'read_org'],
    reports: ['read_org', 'export_own']
  },
  [UserRole.USUARIO_BASICO]: {
    organizations: ['read_own'],
    users: ['read_own', 'update_own'],
    categories: ['read'],
    transactions: ['create', 'read_own', 'update_own', 'delete_own'],
    budgets: ['create', 'read_own', 'update_own', 'delete_own'],
    reports: ['read_own']
  }
}

/**
 * Middleware para verificar roles específicos
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso'
      })
    }

    const userRole = req.user.role as UserRole

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes',
        message: `Necesitas uno de estos roles: ${allowedRoles.join(', ')}`
      })
    }

    next()
  }
}

/**
 * Middleware para verificar permisos específicos sobre recursos
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso'
      })
    }

    const userRole = req.user.role as UserRole
    
    // Mapeo de permisos simplificado
    const rolePermissions = {
      [UserRole.ADMIN]: ['VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS', 'DELETE_USERS', 'MANAGE_ORGANIZATIONS'],
      [UserRole.COLABORADOR]: ['VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS'],
      [UserRole.USUARIO_BASICO]: ['VIEW_USERS'] // Solo puede verse a sí mismo
    }

    const userPermissions = rolePermissions[userRole] || []

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes',
        message: `No tienes el permiso requerido: ${permission}`
      })
    }

    next()
  }
}

/**
 * Middleware para verificar acceso propio o con permisos
 */
export function requireSelfOrPermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso'
      })
    }

    const userId = req.params.id
    const currentUserId = req.user.userId
    const userRole = req.user.role as UserRole

    // Si es el mismo usuario, permitir acceso
    if (userId === currentUserId) {
      return next()
    }

    // Si no es el mismo usuario, verificar permisos
    const rolePermissions = {
      [UserRole.ADMIN]: ['VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS', 'DELETE_USERS'],
      [UserRole.COLABORADOR]: ['VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS'],
      [UserRole.USUARIO_BASICO]: []
    }

    const userPermissions = rolePermissions[userRole] || []

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes',
        message: `Solo puedes acceder a tu propio perfil o tener el permiso: ${permission}`
      })
    }

    // Para COLABORADOR, verificar que el usuario esté en la misma organización
    if (userRole === UserRole.COLABORADOR) {
      try {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { organizationId: true }
        })

        if (!targetUser || targetUser.organizationId !== req.user.organizationId) {
          return res.status(403).json({
            success: false,
            error: 'Permisos insuficientes',
            message: 'Solo puedes acceder a usuarios de tu organización'
          })
        }
      } catch (error) {
        console.error('Error checking user organization:', error)
        return res.status(500).json({
          success: false,
          message: 'Error verificando permisos'
        })
      }
    }

    next()
  }
}

/**
 * Middleware para verificar acceso a transacciones
 */
export async function requireTransactionAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const transactionId = req.params.transactionId || req.params.id
    const userRole = req.user!.role as UserRole
    const userId = req.user!.userId
    const organizationId = req.user!.organizationId

    // Admin puede acceder a cualquier transacción
    if (userRole === UserRole.ADMIN) {
      return next()
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'ID de transacción requerido'
      })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            organizationId: true
          }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      })
    }

    // Usuario básico: solo sus propias transacciones
    if (userRole === UserRole.USUARIO_BASICO) {
      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propias transacciones'
        })
      }
    }

    // Colaborador: transacciones de su organización
    if (userRole === UserRole.COLABORADOR) {
      if (transaction.user.organizationId !== organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a transacciones de tu organización'
        })
      }
    }

    next()
  } catch (error) {
    console.error('Error checking transaction access:', error)
    res.status(500).json({
      success: false,
      message: 'Error verificando acceso a transacción'
    })
  }
}

/**
 * Middleware para verificar acceso a presupuestos
 */
export async function requireBudgetAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const budgetId = req.params.budgetId || req.params.id
    const userRole = req.user!.role as UserRole
    const userId = req.user!.userId
    const organizationId = req.user!.organizationId

    // Admin puede acceder a cualquier presupuesto
    if (userRole === UserRole.ADMIN) {
      return next()
    }

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        message: 'ID de presupuesto requerido'
      })
    }

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        user: {
          select: {
            id: true,
            organizationId: true
          }
        }
      }
    })

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Usuario básico: solo sus propios presupuestos
    if (userRole === UserRole.USUARIO_BASICO) {
      if (budget.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propios presupuestos'
        })
      }
    }

    // Colaborador: presupuestos de su organización
    if (userRole === UserRole.COLABORADOR) {
      if (budget.user.organizationId !== organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a presupuestos de tu organización'
        })
      }
    }

    next()
  } catch (error) {
    console.error('Error checking budget access:', error)
    res.status(500).json({
      success: false,
      message: 'Error verificando acceso a presupuesto'
    })
  }
}

/**
 * Middleware para verificar acceso a usuarios
 */
export async function requireUserAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId || req.params.id
    const currentUserRole = req.user!.role as UserRole
    const currentUserId = req.user!.userId
    const currentUserOrgId = req.user!.organizationId

    // Admin puede acceder a cualquier usuario
    if (currentUserRole === UserRole.ADMIN) {
      return next()
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      })
    }

    // Acceso a su propio perfil
    if (targetUserId === currentUserId) {
      return next()
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        organizationId: true
      }
    })

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // Colaborador: usuarios de su organización
    if (currentUserRole === UserRole.COLABORADOR) {
      if (targetUser.organizationId !== currentUserOrgId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a usuarios de tu organización'
        })
      }
      return next()
    }

    // Usuario básico: solo su propio perfil
    return res.status(403).json({
      success: false,
      message: 'Solo puedes acceder a tu propio perfil'
    })

  } catch (error) {
    console.error('Error checking user access:', error)
    res.status(500).json({
      success: false,
      message: 'Error verificando acceso a usuario'
    })
  }
}

/**
 * Función helper para verificar si un usuario puede realizar una acción sobre un recurso
 */
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions[resource] && permissions[resource].includes(action)
}

/**
 * Función helper para obtener todos los permisos de un rol
 */
export function getRolePermissions(userRole: UserRole) {
  return ROLE_PERMISSIONS[userRole] || {}
} 