import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rolePermissions.js'
import { UserRole } from '../types/index.js'
import { 
  getBudgets, 
  getBudgetById, 
  createBudget, 
  updateBudget, 
  deleteBudget,
  getBudgetReport,
  getBudgetStatus,
  checkBudgetAlerts,
  getRecurringPreview,
  generateRecurringBudgets,
  cleanupDuplicateBudgets
} from '../controllers/budgetController.js'

const router = Router()

/**
 * @route GET /api/v1/budgets
 * @desc Obtener lista de presupuestos
 * @access ADMIN (org seleccionada), COLABORADOR (su org), USUARIO_BASICO (propios)
 */
router.get('/', authenticateToken, getBudgets)

/**
 * @route GET /api/v1/budgets/reports/summary
 * @desc Obtener reporte consolidado de presupuestos
 * @access ADMIN (org seleccionada), COLABORADOR (su org), USUARIO_BASICO (propio)
 */
router.get('/reports/summary', authenticateToken, getBudgetReport)

/**
 * @route POST /api/v1/budgets
 * @desc Crear nuevo presupuesto
 * @access ADMIN, COLABORADOR (no USUARIO_BASICO)
 */
router.post('/', authenticateToken, createBudget)

/**
 * @route GET /api/v1/budgets/:id
 * @desc Obtener presupuesto específico
 * @access ADMIN (cualquier presupuesto), COLABORADOR (su org), USUARIO_BASICO (propio)
 */
router.get('/:id', authenticateToken, getBudgetById)

/**
 * @route PUT /api/v1/budgets/:id
 * @desc Actualizar presupuesto
 * @access ADMIN (cualquier presupuesto), COLABORADOR (propios)
 */
router.put('/:id', authenticateToken, updateBudget)

/**
 * @route DELETE /api/v1/budgets/:id
 * @desc Eliminar presupuesto (soft delete)
 * @access ADMIN (cualquier presupuesto), COLABORADOR (propios)
 */
router.delete('/:id', authenticateToken, deleteBudget)

/**
 * @route GET /api/v1/budgets/:id/status
 * @desc Obtener estado específico de presupuesto
 * @access ADMIN (cualquier presupuesto), COLABORADOR (su org), USUARIO_BASICO (propio)
 */
router.get('/:id/status', authenticateToken, getBudgetStatus)

/**
 * @route POST /api/v1/budgets/:id/check-alerts
 * @desc Verificar y crear alertas de presupuesto
 * @access ADMIN (cualquier presupuesto), COLABORADOR (su org), USUARIO_BASICO (propio)
 */
router.post('/:id/check-alerts', authenticateToken, checkBudgetAlerts)

/**
 * @route GET /api/v1/budgets/:id/recurring/preview
 * @desc Vista previa de presupuestos recurrentes
 * @access ADMIN (cualquier presupuesto), COLABORADOR (su org), USUARIO_BASICO (propio)
 */
router.get('/:id/recurring/preview', authenticateToken, getRecurringPreview)

/**
 * @route POST /api/v1/budgets/:id/recurring/generate
 * @desc Generar presupuestos recurrentes manualmente
 * @access ADMIN, COLABORADOR (propios)
 */
router.post('/:id/recurring/generate', authenticateToken, generateRecurringBudgets)

/**
 * @route POST /api/v1/budgets/cleanup-duplicates
 * @desc Limpiar presupuestos duplicados
 * @access ADMIN, COLABORADOR
 */
router.post('/cleanup-duplicates', authenticateToken, cleanupDuplicateBudgets)

export default router 