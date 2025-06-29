import { Router } from 'express'
import { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  updateUserOrganization,
  getCurrentUserPermissions
} from '../controllers/userController.js'
import { authenticateToken } from '../middleware/auth.js'
import { 
  requireRole, 
  requirePermission,
  requireSelfOrPermission 
} from '../middleware/rolePermissions.js'
import { UserRole } from '../types/index.js'
import { prisma } from '../config/database.js'
import bcrypt from 'bcrypt'

const router = Router()

/**
 * @route GET /api/v1/users
 * @desc Obtener lista de usuarios con filtros y paginación
 * @access ADMIN (todos), COLABORADOR (su organización), USUARIO_BASICO (solo él mismo)
 */
router.get('/', 
  authenticateToken,
  requirePermission('VIEW_USERS'),
  getUsers
)

/**
 * @route GET /api/v1/users/stats
 * @desc Obtener estadísticas de usuarios (solo ADMIN)
 * @access ADMIN only
 */
router.get('/stats',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req, res) => {
    try {
      // TODO: Implementar estadísticas de usuarios
      res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          byRole: {
            ADMIN: 0,
            COLABORADOR: 0,
            USUARIO_BASICO: 0
          },
          byOrganization: {}
        },
        message: 'Estadísticas obtenidas exitosamente'
      })
    } catch (error) {
      console.error('Error getting user stats:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route GET /api/v1/users/me
 * @desc Obtener perfil del usuario actual
 * @access Private
 */
router.get('/me',
  authenticateToken,
  getCurrentUserPermissions
)

/**
 * @route POST /api/v1/users
 * @desc Crear nuevo usuario (solo ADMIN y COLABORADOR)
 * @access ADMIN (cualquier usuario), COLABORADOR (usuarios de su organización)
 */
router.post('/',
  authenticateToken,
  requirePermission('CREATE_USERS'),
  async (req, res) => {
    try {
      const { name, email, password, role, organizationId } = req.body
      const currentUserRole = req.user!.role as UserRole
      const currentUserOrgId = req.user!.organizationId

      // Validaciones básicas
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: name, email, password, role'
        })
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        })
      }

      // Validar rol
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        })
      }

      // Validar contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        })
      }

      // Verificar permisos para crear el rol especificado
      if (currentUserRole === UserRole.COLABORADOR) {
        // COLABORADOR no puede crear ADMIN
        if (role === UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para crear usuarios administradores'
          })
        }
        
        // COLABORADOR solo puede crear usuarios en su organización
        if (organizationId && organizationId !== currentUserOrgId) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes crear usuarios en tu organización'
          })
        }
      }

      // Verificar que el email no esté en uso
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con este email'
        })
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 12)

      // Determinar organización
      let finalOrganizationId = organizationId
      if (currentUserRole === UserRole.COLABORADOR && !finalOrganizationId) {
        finalOrganizationId = currentUserOrgId
      }

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          role: role as UserRole,
          organizationId: finalOrganizationId || null,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'Usuario creado exitosamente'
      })
    } catch (error) {
      console.error('Error creating user:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route POST /api/v1/users/invite
 * @desc Invitar usuario por email (solo ADMIN y COLABORADOR)
 * @access ADMIN (cualquier organización), COLABORADOR (su organización)
 */
router.post('/invite',
  authenticateToken,
  requirePermission('CREATE_USERS'),
  async (req, res) => {
    try {
      // TODO: Implementar invitación de usuarios
      res.status(501).json({
        success: false,
        message: 'Funcionalidad de invitación no implementada aún'
      })
    } catch (error) {
      console.error('Error inviting user:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route GET /api/v1/users/validate-email
 * @desc Validar disponibilidad de email
 * @access ADMIN, COLABORADOR
 */
router.get('/validate-email',
  authenticateToken,
  requirePermission('CREATE_USERS'),
  async (req, res) => {
    try {
      // TODO: Implementar validación de email
      res.json({
        success: true,
        data: { isAvailable: true },
        message: 'Email validado'
      })
    } catch (error) {
      console.error('Error validating email:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route GET /api/v1/users/me/organizations
 * @desc Obtener organizaciones disponibles para el usuario actual
 * @access Todos los usuarios autenticados
 */
router.get('/me/organizations',
  authenticateToken,
  async (req, res) => {
    try {
      const userRole = req.user!.role as UserRole
      const userOrgId = req.user!.organizationId

      let organizations = []

      if (userRole === UserRole.ADMIN) {
        // ADMIN puede ver todas las organizaciones activas
        organizations = await prisma.organization.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                users: true
              }
            }
          },
          orderBy: { name: 'asc' }
        })
      } else if (userRole === UserRole.COLABORADOR && userOrgId) {
        // COLABORADOR ve solo su organización (por ahora simplificado)
        const organization = await prisma.organization.findUnique({
          where: { id: userOrgId },
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                users: true
              }
            }
          }
        })
        
        if (organization) {
          organizations = [organization]
        }
      }
      // USUARIO_BASICO no necesita seleccionar organización

      res.json({
        success: true,
        data: organizations,
        message: 'Organizaciones disponibles obtenidas exitosamente'
      })
    } catch (error) {
      console.error('Error getting user organizations:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route GET /api/v1/users/:id
 * @desc Obtener usuario específico por ID
 * @access ADMIN (cualquier usuario), COLABORADOR (usuarios de su organización), USUARIO_BASICO (solo él mismo)
 */
router.get('/:id',
  authenticateToken,
  requireSelfOrPermission('VIEW_USERS'),
  getUserById
)

/**
 * @route PUT /api/v1/users/:id
 * @desc Actualizar usuario existente
 * @access ADMIN (cualquier usuario), COLABORADOR (usuarios de su organización), USUARIO_BASICO (solo él mismo)
 */
router.put('/:id',
  authenticateToken,
  requireSelfOrPermission('EDIT_USERS'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { name, email, isActive, organizationId, role } = req.body
      const currentUserRole = req.user!.role as UserRole
      const currentUserId = req.user!.userId
      const currentUserOrgId = req.user!.organizationId

      // IMPORTANTE: No se permite cambio de rol en esta función
      // Para cambiar roles usar PUT /api/v1/users/:id/role
      if (role !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cambiar el rol del usuario en esta función. Usar PUT /api/v1/users/:id/role'
        })
      }

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true
        }
      })

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        })
      }

      // Validaciones de permisos adicionales
      if (currentUserRole === UserRole.COLABORADOR) {
        // COLABORADOR solo puede editar usuarios de su organización
        if (existingUser.organizationId !== currentUserOrgId) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes editar usuarios de tu organización'
          })
        }
      }

      // Validar email si se está cambiando
      if (email && email !== existingUser.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          })
        }

        // Verificar que el nuevo email no esté en uso
        const emailInUse = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() }
        })

        if (emailInUse && emailInUse.id !== id) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un usuario con este email'
          })
        }
      }

      // Construir objeto de actualización
      const updateData: any = {}
      
      if (name !== undefined) {
        updateData.name = name.trim()
      }
      
      if (email !== undefined) {
        updateData.email = email.toLowerCase().trim()
      }
      
      // Solo ADMIN y COLABORADOR pueden cambiar el estado activo
      if (isActive !== undefined && currentUserRole !== UserRole.USUARIO_BASICO) {
        updateData.isActive = isActive
      }
      
      // Solo ADMIN puede cambiar la organización
      if (organizationId !== undefined && currentUserRole === UserRole.ADMIN) {
        updateData.organizationId = organizationId || null
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
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
        message: 'Usuario actualizado exitosamente'
      })
    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route PUT /api/v1/users/:id/role
 * @desc Cambiar rol de usuario (con restricciones por rol)
 * @access ADMIN (cualquier cambio), COLABORADOR (limitado)
 */
router.put('/:id/role',
  authenticateToken,
  requirePermission('EDIT_USERS'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { role } = req.body
      const currentUserRole = req.user!.role as UserRole
      const currentUserId = req.user!.userId
      const currentUserOrgId = req.user!.organizationId

      // Validaciones básicas
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'El campo role es requerido'
        })
      }

      // Validar que el rol sea válido
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        })
      }

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          organizationId: true,
          name: true,
          email: true
        }
      })

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        })
      }

      // Evitar que se cambie su propio rol
      if (id === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'No puedes cambiar tu propio rol'
        })
      }

      // VALIDACIONES ESPECÍFICAS POR ROL ACTUAL
      if (currentUserRole === UserRole.COLABORADOR) {
        // COLABORADOR solo puede cambiar roles en su organización
        if (existingUser.organizationId !== currentUserOrgId) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes cambiar roles de usuarios de tu organización'
          })
        }

        // COLABORADOR NO puede crear/editar ADMINISTRADORES
        if (role === UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para asignar el rol de Administrador'
          })
        }

        // COLABORADOR NO puede cambiar rol de ADMINISTRADORES existentes
        if (existingUser.role === UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'No puedes cambiar el rol de usuarios administradores'
          })
        }

        // COLABORADOR solo puede asignar COLABORADOR o USUARIO_BASICO
        if (role !== UserRole.COLABORADOR && role !== UserRole.USUARIO_BASICO) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes asignar los roles: Colaborador o Usuario Básico'
          })
        }
      }

      // Si no hay cambio de rol, no hacer nada
      if (existingUser.role === role) {
        return res.json({
          success: true,
          data: {
            id: existingUser.id,
            role: existingUser.role,
            name: existingUser.name,
            email: existingUser.email
          },
          message: 'El usuario ya tiene ese rol asignado'
        })
      }

      // Actualizar rol del usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role: role as UserRole },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
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
        message: `Rol del usuario cambiado exitosamente a ${role}`
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route PUT /api/v1/users/:id/status
 * @desc Activar/Desactivar usuario (solo ADMIN y COLABORADOR)
 * @access ADMIN (cualquier usuario), COLABORADOR (usuarios de su organización)
 */
router.put('/:id/status',
  authenticateToken,
  requirePermission('EDIT_USERS'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { isActive } = req.body
      const currentUserRole = req.user!.role as UserRole
      const currentUserId = req.user!.userId
      const currentUserOrgId = req.user!.organizationId

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo isActive debe ser un booleano'
        })
      }

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          organizationId: true,
          isActive: true
        }
      })

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        })
      }

      // Evitar que se desactive a sí mismo
      if (id === currentUserId && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivarte a ti mismo'
        })
      }

      // COLABORADOR solo puede cambiar estado de usuarios de su organización
      if (currentUserRole === UserRole.COLABORADOR) {
        if (existingUser.organizationId !== currentUserOrgId) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes cambiar el estado de usuarios de tu organización'
          })
        }
        
        // COLABORADOR no puede desactivar otros ADMIN
        if (existingUser.role === UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'No puedes cambiar el estado de usuarios administradores'
          })
        }
      }

      // Actualizar estado del usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
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
        message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`
      })
    } catch (error) {
      console.error('Error toggling user status:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route PUT /api/v1/users/:id/organization
 * @desc Mover usuario a otra organización (solo ADMIN)
 * @access ADMIN only
 */
router.put('/:id/organization',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  updateUserOrganization
)

/**
 * @route POST /api/v1/users/:id/reset-password
 * @desc Resetear contraseña de usuario (solo ADMIN y COLABORADOR)
 * @access ADMIN (cualquier usuario), COLABORADOR (usuarios de su organización)
 */
router.post('/:id/reset-password',
  authenticateToken,
  requirePermission('EDIT_USERS'),
  async (req, res) => {
    try {
      // TODO: Implementar reset password
      res.status(501).json({
        success: false,
        message: 'Funcionalidad no implementada aún'
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route POST /api/v1/users/:id/resend-invitation
 * @desc Reenviar invitación a usuario (solo ADMIN y COLABORADOR)
 * @access ADMIN (cualquier usuario), COLABORADOR (usuarios de su organización)
 */
router.post('/:id/resend-invitation',
  authenticateToken,
  requirePermission('EDIT_USERS'),
  async (req, res) => {
    try {
      // TODO: Implementar reenvío de invitación
      res.status(501).json({
        success: false,
        message: 'Funcionalidad no implementada aún'
      })
    } catch (error) {
      console.error('Error resending invitation:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route DELETE /api/v1/users/:id
 * @desc Eliminar/Desactivar usuario (solo ADMIN)
 * @access ADMIN only
 */
router.delete('/:id',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req, res) => {
    try {
      const { id } = req.params
      const currentUserId = req.user!.userId

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          isActive: true,
          _count: {
            select: {
              transactions: true,
              budgets: true
            }
          }
        }
      })

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        })
      }

      // Evitar que se elimine a sí mismo
      if (id === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminarte a ti mismo'
        })
      }

      // Verificar si el usuario tiene datos asociados
      const hasTransactions = existingUser._count.transactions > 0
      const hasBudgets = existingUser._count.budgets > 0

      if (hasTransactions || hasBudgets) {
        // Soft delete: solo desactivar el usuario
        const updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            isActive: false,
            // Opcional: cambiar email para permitir reutilización
            email: `deleted_${Date.now()}_${existingUser.id}@deleted.user`
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        })

        return res.json({
          success: true,
          data: updatedUser,
          message: 'Usuario desactivado exitosamente (tiene datos asociados)'
        })
      } else {
        // Hard delete: eliminar completamente el usuario
        await prisma.user.delete({
          where: { id }
        })

        return res.json({
          success: true,
          data: { id },
          message: 'Usuario eliminado exitosamente'
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

/**
 * @route PUT /api/v1/users/me
 * @desc Actualizar perfil del usuario actual
 * @access Private
 */
router.put('/me',
  authenticateToken,
  async (req, res) => {
    try {
      // TODO: Implementar actualización de perfil propio
      res.status(501).json({
        success: false,
        message: 'Funcionalidad no implementada aún'
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
)

export default router 