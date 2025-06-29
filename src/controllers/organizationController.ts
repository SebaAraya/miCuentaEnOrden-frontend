import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../types/index.js'
import { prisma } from '../config/database.js'
import { UserRole } from '../types/index.js'

/**
 * GET /api/v1/organizations - Obtener organizaciones según rol
 * ADMIN: Ve todas las organizaciones
 * COLABORADOR: Ve solo las organizaciones a las que pertenece
 */
export async function getOrganizations(req: AuthenticatedRequest, res: Response) {
  try {
    const { page = '1', limit = '20', search } = req.query
    const userRole = req.user!.role as UserRole
    const userOrgId = req.user!.organizationId

    const pageNum = parseInt(page as string) || 1
    const limitNum = Math.min(parseInt(page as string) || 20, 100)
    const skip = (pageNum - 1) * limitNum

    // Construir filtros según rol
    const where: any = { isActive: true }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    // COLABORADOR solo ve las organizaciones a las que pertenece
    if (userRole === UserRole.COLABORADOR) {
      if (!userOrgId) {
        return res.json({
          success: true,
          data: {
            organizations: [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              pages: 0
            }
          },
          message: 'No perteneces a ninguna organización'
        })
      }
      
      // Filtrar solo la organización del usuario
      where.id = userOrgId
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          _count: {
            select: {
              users: true,
              categories: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.organization.count({ where })
    ])

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Organizaciones obtenidas exitosamente'
    })
  } catch (error) {
    console.error('Error getting organizations:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/organizations/:id - Obtener organización específica
 */
export async function getOrganizationById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userRole = req.user!.role as UserRole
    const userOrgId = req.user!.organizationId

    // Verificar permisos: ADMIN puede ver cualquier org, otros solo la suya
    if (userRole !== UserRole.ADMIN && userOrgId !== id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta organización'
      })
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true
          },
          orderBy: { name: 'asc' }
        },
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            icon: true,
            colorHex: true
          }
        },
        _count: {
          select: {
            users: true,
            categories: true
          }
        }
      }
    })

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      })
    }

    res.json({
      success: true,
      data: organization,
      message: 'Organización obtenida exitosamente'
    })
  } catch (error) {
    console.error('Error getting organization:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * POST /api/v1/organizations - Crear organización (solo ADMIN)
 */
export async function createOrganization(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, settings = {} } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la organización es requerido'
      })
    }

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        settings,
        isActive: true
      }
    })

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organización creada exitosamente'
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * PUT /api/v1/organizations/:id - Actualizar organización
 */
export async function updateOrganization(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const { name, description, settings } = req.body
    const userRole = req.user!.role as UserRole
    const userOrgId = req.user!.organizationId

    // Verificar permisos: ADMIN puede editar cualquier org, COLABORADOR solo la suya
    if (userRole === UserRole.USUARIO_BASICO) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar organizaciones'
      })
    }

    if (userRole === UserRole.COLABORADOR && userOrgId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes modificar tu propia organización'
      })
    }

    // Verificar que la organización existe
    const existingOrg = await prisma.organization.findUnique({
      where: { id }
    })

    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      })
    }

    // Verificar nombre único si se está cambiando
    if (name && name.trim() !== existingOrg.name) {
      const duplicateOrg = await prisma.organization.findFirst({
        where: {
          name: name.trim(),
          isActive: true,
          id: { not: id }
        }
      })

      if (duplicateOrg) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una organización con ese nombre'
        })
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(settings && { settings })
      },
      include: {
        _count: {
          select: {
            users: true,
            categories: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedOrg,
      message: 'Organización actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating organization:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * DELETE /api/v1/organizations/:id - Desactivar organización (solo ADMIN)
 */
export async function deleteOrganization(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params

    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      })
    }

    // Verificar si tiene usuarios activos
    const activeUsers = await prisma.user.count({
      where: {
        organizationId: id,
        isActive: true
      }
    })

    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la organización. Tiene ${activeUsers} usuarios activos. Primero debes reubicar o desactivar a los usuarios.`
      })
    }

    // Soft delete - marcar como inactiva
    await prisma.organization.update({
      where: { id },
      data: { isActive: false }
    })

    res.json({
      success: true,
      message: 'Organización desactivada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting organization:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/organizations/:id/users - Obtener usuarios de una organización
 */
export async function getOrganizationUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userRole = req.user!.role as UserRole
    const userOrgId = req.user!.organizationId

    // Verificar permisos
    if (userRole !== UserRole.ADMIN && userOrgId !== id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los usuarios de esta organización'
      })
    }

    const users = await prisma.user.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: users,
      message: 'Usuarios obtenidos exitosamente'
    })
  } catch (error) {
    console.error('Error getting organization users:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/organizations/:id/stats - Obtener estadísticas de organización
 */
export async function getOrganizationStats(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userRole = req.user!.role as UserRole
    const userOrgId = req.user!.organizationId

    // Verificar permisos
    if (userRole !== UserRole.ADMIN && userOrgId !== id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las estadísticas de esta organización'
      })
    }

    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id }
    })

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      })
    }

    // Obtener estadísticas
    const [userCount, activeUserCount, categoryCount, transactionCount] = await Promise.all([
      // Total de usuarios
      prisma.user.count({
        where: { organizationId: id }
      }),
      // Usuarios activos
      prisma.user.count({
        where: { 
          organizationId: id,
          isActive: true 
        }
      }),
      // Categorías personalizadas
      prisma.category.count({
        where: { organizationId: id }
      }),
      // Total de transacciones
      prisma.transaction.count({
        where: {
          user: {
            organizationId: id
          }
        }
      })
    ])

    // Obtener total de transacciones en valores monetarios
    const totalTransactionsValue = await prisma.transaction.aggregate({
      where: {
        user: {
          organizationId: id
        }
      },
      _sum: {
        amount: true
      }
    })

    const stats = {
      id,
      name: organization.name,
      userCount,
      activeUserCount,
      categoryCount,
      transactionCount,
      totalTransactions: totalTransactionsValue._sum.amount?.toNumber() || 0
    }

    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas obtenidas exitosamente'
    })
  } catch (error) {
    console.error('Error getting organization stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * PUT /api/v1/organizations/:id/users/:userId/role - Cambiar rol de usuario
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: organizationId, userId } = req.params
    const { role } = req.body
    const currentUserRole = req.user!.role as UserRole
    const currentUserOrgId = req.user!.organizationId

    // Validar rol
    if (!role || !['ADMIN', 'COLABORADOR', 'USUARIO_BASICO'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser: ADMIN, COLABORADOR o USUARIO_BASICO'
      })
    }

    // Solo ADMIN puede cambiar roles de usuarios
    if (currentUserRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden cambiar roles de usuarios'
      })
    }

    // Verificar que el usuario existe y pertenece a la organización
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organizationId
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en esta organización'
      })
    }

    // Evitar que se cambie el rol del usuario actual si es el único ADMIN
    if (user.id === req.user!.userId && user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: organizationId,
          role: UserRole.ADMIN,
          isActive: true
        }
      })

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'No puedes cambiar tu propio rol de ADMIN si eres el único administrador'
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true
      }
    })

    res.json({
      success: true,
      data: updatedUser,
      message: 'Rol de usuario actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
} 