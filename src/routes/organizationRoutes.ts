import { Router } from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import {
  getOrganizations,
  createOrganization,
  getOrganizationUsers,
  getOrganizationStats,
  updateOrganization,
  deleteOrganization
} from '../controllers/organizationController.js'

const router = Router()

// ========================================
// RUTAS DE ORGANIZACIONES
// ========================================

/**
 * GET /api/v1/organizations - Listar organizaciones (solo ADMIN)
 */
router.get('/', 
  authenticateToken, 
  requireRole(UserRole.ADMIN, UserRole.COLABORADOR), 
  getOrganizations
)

/**
 * POST /api/v1/organizations - Crear organización (solo ADMIN)
 */
router.post('/', 
  authenticateToken, 
  requireRole(UserRole.ADMIN), 
  createOrganization
)

/**
 * GET /api/v1/organizations/:id/users - Obtener usuarios de organización
 * ADMIN: puede ver cualquier organización
 * COLABORADOR: solo su propia organización
 */
router.get('/:id/users', 
  authenticateToken, 
  requireRole(UserRole.ADMIN, UserRole.COLABORADOR), 
  getOrganizationUsers
)

/**
 * GET /api/v1/organizations/:id/stats - Obtener estadísticas de organización
 * ADMIN: puede ver cualquier organización
 * COLABORADOR: solo su propia organización
 */
router.get('/:id/stats', 
  authenticateToken, 
  requireRole(UserRole.ADMIN, UserRole.COLABORADOR), 
  getOrganizationStats
)

/**
 * PUT /api/v1/organizations/:id - Actualizar organización (solo ADMIN)
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(UserRole.ADMIN), 
  updateOrganization
)

/**
 * DELETE /api/v1/organizations/:id - Eliminar organización (solo ADMIN)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(UserRole.ADMIN), 
  deleteOrganization
)

export default router 