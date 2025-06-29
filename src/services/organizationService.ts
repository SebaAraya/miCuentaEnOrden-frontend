import { prisma } from '../config/database.js'
import { UserRole } from '../types/index.js'

export interface OrganizationStats {
  id: string
  name: string
  userCount: number
  activeUserCount: number
  categoryCount: number
  transactionCount: number
  totalTransactions: number
}

/**
 * Servicio para gestión de organizaciones
 */
export class OrganizationService {
  
  /**
   * Obtener estadísticas de una organización
   */
  static async getOrganizationStats(organizationId: string): Promise<OrganizationStats | null> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          _count: {
            select: {
              users: true,
              categories: true
            }
          }
        }
      })

      if (!organization) {
        return null
      }

      const [activeUserCount, transactionCount, totalTransactionValue] = await Promise.all([
        prisma.user.count({
          where: {
            organizationId: organizationId,
            isActive: true
          }
        }),
        prisma.transaction.count({
          where: {
            user: {
              organizationId: organizationId
            }
          }
        }),
        prisma.transaction.aggregate({
          where: {
            user: {
              organizationId: organizationId
            }
          },
          _sum: {
            amount: true
          }
        })
      ])

      return {
        id: organization.id,
        name: organization.name,
        userCount: organization._count.users,
        activeUserCount,
        categoryCount: organization._count.categories,
        transactionCount,
        totalTransactions: Number(totalTransactionValue._sum.amount || 0)
      }
    } catch (error) {
      console.error('Error getting organization stats:', error)
      throw new Error('Error obteniendo estadísticas de organización')
    }
  }

  /**
   * Verificar si un usuario puede gestionar otro usuario
   */
  static async canManageUser(
    currentUserId: string,
    targetUserId: string,
    currentUserRole: UserRole
  ): Promise<boolean> {
    try {
      // ADMIN puede gestionar cualquier usuario
      if (currentUserRole === UserRole.ADMIN) {
        return true
      }

      // No puede gestionarse a sí mismo con esta función
      if (currentUserId === targetUserId) {
        return false
      }

      // COLABORADOR puede gestionar usuarios de su organización
      if (currentUserRole === UserRole.COLABORADOR) {
        const [currentUser, targetUser] = await Promise.all([
          prisma.user.findUnique({
            where: { id: currentUserId },
            select: { organizationId: true }
          }),
          prisma.user.findUnique({
            where: { id: targetUserId },
            select: { organizationId: true, role: true }
          })
        ])

        if (!currentUser || !targetUser) {
          return false
        }

        // Mismo organización y el target no es ADMIN
        return currentUser.organizationId === targetUser.organizationId && 
               targetUser.role !== UserRole.ADMIN
      }

      // USUARIO_BASICO no puede gestionar otros usuarios
      return false
    } catch (error) {
      console.error('Error checking user management permissions:', error)
      return false
    }
  }

  /**
   * Obtener usuarios que un usuario puede gestionar
   */
  static async getManagedUsers(userId: string, userRole: UserRole, organizationId?: string) {
    try {
      let where: any = { isActive: true }

      if (userRole === UserRole.ADMIN) {
        // ADMIN puede ver todos los usuarios
      } else if (userRole === UserRole.COLABORADOR && organizationId) {
        // COLABORADOR puede ver usuarios de su organización
        where.organizationId = organizationId
      } else {
        // USUARIO_BASICO solo se ve a sí mismo
        where.id = userId
      }

      return await prisma.user.findMany({
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
        orderBy: { name: 'asc' }
      })
    } catch (error) {
      console.error('Error getting managed users:', error)
      throw new Error('Error obteniendo usuarios gestionables')
    }
  }
} 