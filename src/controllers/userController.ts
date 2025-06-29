import { Response } from 'express'
import { AuthenticatedRequest } from '../types/index.js'
import { prisma } from '../config/database.js'
import { UserRole } from '../types/index.js'
import { OrganizationService } from '../services/organizationService.js'

/**
 * GET /api/v1/users - Obtener usuarios gestionables
 */
export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { page = '1', limit = '20', role, organizationId, search } = req.query
    const currentUserRole = req.user!.role as UserRole
    const currentUserId = req.user!.userId
    const currentUserOrgId = req.user!.organizationId

    const pageNum = parseInt(page as string) || 1
    const limitNum = Math.min(parseInt(limit as string) || 20, 100)
    const skip = (pageNum - 1) * limitNum

    // Construir filtros basados en rol
    let where: any = { isActive: true }

    if (currentUserRole === UserRole.ADMIN) {
      // ADMIN puede ver todos los usuarios
      if (organizationId) {
        where.organizationId = organizationId
      }
    } else if (currentUserRole === UserRole.COLABORADOR) {
      // COLABORADOR solo usuarios de su organización
      where.organizationId = currentUserOrgId
    } else {
      // USUARIO_BASICO solo se ve a sí mismo
      where.id = currentUserId
    }

    // Filtros adicionales
    if (role && ['ADMIN', 'COLABORADOR', 'USUARIO_BASICO'].includes(role as string)) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ])

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Usuarios obtenidos exitosamente'
    })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/users/:id - Obtener usuario específico
 */
export async function getUserById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const currentUserRole = req.user!.role as UserRole
    const currentUserId = req.user!.userId
    const currentUserOrgId = req.user!.organizationId

    // Verificar permisos de acceso
    if (currentUserRole === UserRole.USUARIO_BASICO && id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes ver tu propio perfil'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        preferences: true,
        organization: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // COLABORADOR solo puede ver usuarios de su organización
    if (currentUserRole === UserRole.COLABORADOR && 
        user.organization?.id !== currentUserOrgId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este usuario'
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'Usuario obtenido exitosamente'
    })
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * PUT /api/v1/users/:id/role - Cambiar rol de usuario (solo ADMIN)
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const { role } = req.body
    const currentUserId = req.user!.userId

    // Validar rol
    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      })
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        organizationId: true
      }
    })

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // Evitar que el usuario se quite el rol de ADMIN si es el único
    if (targetUser.id === currentUserId && 
        targetUser.role === UserRole.ADMIN && 
        role !== UserRole.ADMIN &&
        targetUser.organizationId) {
      
      const adminCount = await prisma.user.count({
        where: {
          organizationId: targetUser.organizationId,
          role: UserRole.ADMIN,
          isActive: true
        }
      })

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'No puedes quitarte el rol de ADMIN si eres el único administrador'
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedUser,
      message: 'Rol actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * PUT /api/v1/users/:id/organization - Cambiar organización de usuario (solo ADMIN)
 */
export async function updateUserOrganization(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const { organizationId } = req.body

    // Verificar que la organización existe si se proporciona
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      })

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organización no encontrada'
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { organizationId: organizationId || null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedUser,
      message: 'Organización actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating user organization:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/users/me/permissions - Obtener permisos del usuario actual
 */
export async function getCurrentUserPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user!.role as UserRole
    const userId = req.user!.userId
    const organizationId = req.user!.organizationId

    // Definir permisos basados en rol
    const permissions = {
      role: userRole,
      canManageOrganizations: userRole === UserRole.ADMIN,
      canManageUsers: userRole === UserRole.ADMIN || userRole === UserRole.COLABORADOR,
      canViewAllTransactions: userRole === UserRole.ADMIN,
      canViewOrgTransactions: userRole === UserRole.ADMIN || userRole === UserRole.COLABORADOR,
      canManageCategories: true,
      canCreateBudgets: true,
      canViewReports: true,
      canExportData: userRole !== UserRole.USUARIO_BASICO
    }

    // Obtener estadísticas de organización si pertenece a una
    let organizationStats = null
    if (organizationId && (userRole === UserRole.ADMIN || userRole === UserRole.COLABORADOR)) {
      organizationStats = await OrganizationService.getOrganizationStats(organizationId)
    }

    res.json({
      success: true,
      data: {
        permissions,
        organizationStats
      },
      message: 'Permisos obtenidos exitosamente'
    })
  } catch (error) {
    console.error('Error getting user permissions:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
} 