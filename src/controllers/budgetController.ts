import { Response } from 'express'
import { AuthenticatedRequest } from '../types/index.js'
import { BudgetService, CreateBudgetRequest, UpdateBudgetRequest } from '../services/budgetService.js'
import { RecurringBudgetService } from '../services/recurringBudgetService.js'
import { UserRole } from '../types/index.js'
import { prisma } from '../config/database.js'
import { normalizeDateForDB, normalizeEndDateForDB } from '../utils/dateUtils.js'

/**
 * GET /api/v1/budgets - Obtener presupuestos
 * ADMIN: Ve presupuestos de la organización seleccionada
 * COLABORADOR: Ve presupuestos de su organización
 * USUARIO_BASICO: Ve solo sus propios presupuestos
 */
export async function getBudgets(req: AuthenticatedRequest, res: Response) {
  try {
    const { 
      categoryId, 
      isActive, 
      page = '1', 
      limit = '20', 
      search,
      year,
      month
    } = req.query

    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole
    const organizationId = req.headers['x-organization-id'] as string

    // Validar organización para ADMIN y COLABORADOR
    if (userRole === UserRole.ADMIN && !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Los administradores deben seleccionar una organización para ver los presupuestos'
      })
    }

    if (userRole === UserRole.COLABORADOR && !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Los colaboradores deben pertenecer a una organización'
      })
    }

    const filters = {
      categoryId: categoryId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
      search: search as string,
      year: year ? parseInt(year as string) : undefined,
      month: month ? parseInt(month as string) : undefined
    }

    // Log para debug
    console.log('📅 Filtros recibidos:', { year, month, isActive, page, limit })

    const result = await BudgetService.getBudgets(
      userId,
      userRole,
      organizationId,
      filters
    )

    res.json({
      success: true,
      data: result,
      message: 'Presupuestos obtenidos exitosamente'
    })
  } catch (error) {
    console.error('Error getting budgets:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/budgets/:id - Obtener presupuesto específico
 */
export async function getBudgetById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole
    const organizationId = req.user!.organizationId

    const budget = await BudgetService.getBudgetById(id)

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos
    if (userRole === UserRole.USUARIO_BASICO && budget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este presupuesto'
      })
    }

    if (userRole === UserRole.COLABORADOR) {
      // Verificar que el presupuesto pertenece a la misma organización
      const budgetUser = await BudgetService.getBudgetById(id)
      if (!budgetUser || budgetUser.user.id !== userId) {
        // Verificar si el usuario del presupuesto está en la misma organización
        const userFromDb = await prisma.user.findUnique({
          where: { id: budgetUser?.user.id },
          select: { organizationId: true }
        })
        
        if (!userFromDb || userFromDb.organizationId !== organizationId) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para ver este presupuesto'
          })
        }
      }
    }

    res.json({
      success: true,
      data: budget,
      message: 'Presupuesto obtenido exitosamente'
    })
  } catch (error) {
    console.error('Error getting budget by ID:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * POST /api/v1/budgets - Crear presupuesto
 * Solo ADMIN y COLABORADOR pueden crear presupuestos
 */
export async function createBudget(req: AuthenticatedRequest, res: Response) {
  try {
    const budgetData: CreateBudgetRequest = req.body
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Validar que el usuario puede crear presupuestos
    if (userRole === UserRole.USUARIO_BASICO) {
      return res.status(403).json({
        success: false,
        message: 'Los usuarios básicos no pueden crear presupuestos'
      })
    }

    // Validar datos requeridos
    if (!budgetData.name || !budgetData.monthlyAmount || !budgetData.categoryId || !budgetData.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: name, monthlyAmount, categoryId, startDate'
      })
    }

    // Validar montos
    if (budgetData.monthlyAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto mensual debe ser mayor a 0'
      })
    }

    if (budgetData.alertThreshold && (budgetData.alertThreshold < 0 || budgetData.alertThreshold > 100)) {
      return res.status(400).json({
        success: false,
        message: 'El umbral de alerta debe estar entre 0 y 100'
      })
    }

    // Validar fechas
    const startDate = new Date(budgetData.startDate)
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio inválida'
      })
    }

    if (budgetData.endDate) {
      const endDate = new Date(budgetData.endDate)
      if (isNaN(endDate.getTime()) || endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de fin inválida o anterior a la fecha de inicio'
        })
      }
    }

    const budget = await BudgetService.createBudget(budgetData, userId)

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Presupuesto creado exitosamente'
    })
  } catch (error) {
    console.error('Error creating budget:', error)
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * PUT /api/v1/budgets/:id - Actualizar presupuesto
 */
export async function updateBudget(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const updateData: UpdateBudgetRequest = req.body
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Verificar que el presupuesto existe
    const existingBudget = await BudgetService.getBudgetById(id)
    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos
    if (userRole === UserRole.USUARIO_BASICO) {
      return res.status(403).json({
        success: false,
        message: 'Los usuarios básicos no pueden editar presupuestos'
      })
    }

    // COLABORADOR solo puede editar presupuestos de su organización
    if (userRole === UserRole.COLABORADOR && existingBudget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes editar tus propios presupuestos'
      })
    }

    // Validar datos si se proporcionan
    if (updateData.monthlyAmount !== undefined && updateData.monthlyAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto mensual debe ser mayor a 0'
      })
    }

    if (updateData.alertThreshold !== undefined && (updateData.alertThreshold < 0 || updateData.alertThreshold > 100)) {
      return res.status(400).json({
        success: false,
        message: 'El umbral de alerta debe estar entre 0 y 100'
      })
    }

    // Validar fechas
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate)
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de inicio inválida'
        })
      }
    }

    if (updateData.endDate) {
      const endDate = new Date(updateData.endDate)
      const startDate = updateData.startDate ? new Date(updateData.startDate) : existingBudget.startDate
      
      if (isNaN(endDate.getTime()) || endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de fin inválida o anterior a la fecha de inicio'
        })
      }
    }

    const updatedBudget = await BudgetService.updateBudget(id, updateData)

    res.json({
      success: true,
      data: updatedBudget,
      message: 'Presupuesto actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * DELETE /api/v1/budgets/:id - Eliminar presupuesto
 */
export async function deleteBudget(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Verificar que el presupuesto existe
    const existingBudget = await BudgetService.getBudgetById(id)
    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos
    if (userRole === UserRole.USUARIO_BASICO) {
      return res.status(403).json({
        success: false,
        message: 'Los usuarios básicos no pueden eliminar presupuestos'
      })
    }

    // COLABORADOR solo puede eliminar presupuestos propios
    if (userRole === UserRole.COLABORADOR && existingBudget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes eliminar tus propios presupuestos'
      })
    }

    await BudgetService.deleteBudget(id)

    res.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting budget:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/budgets/reports/summary - Obtener reporte de presupuestos
 */
export async function getBudgetReport(req: AuthenticatedRequest, res: Response) {
  try {
    console.log('1111summary!!!!!!!!!!')
    const { year, month } = req.query
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole
    const organizationId = req.headers['x-organization-id'] as string

    let reportUserId: string | undefined
    let reportOrganizationId: string | undefined

    if (userRole === UserRole.USUARIO_BASICO) {
      // USUARIO_BASICO solo ve su propio reporte
      reportUserId = userId
    } else {
      // ADMIN ve reporte de la organización seleccionada
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Deben seleccionar una organización'
        })
      }
      reportOrganizationId = organizationId
    }

    console.log('📊 Generando reporte con parámetros:', {
      reportUserId,
      reportOrganizationId,
      year,
      month,
      userRole
    })

    const report = await BudgetService.generateBudgetReport(
      reportUserId,
      reportOrganizationId,
      parseInt(year as string),
      parseInt(month as string)
    )

    res.json({
      success: true,
      data: report,
      message: 'Reporte de presupuestos generado exitosamente!'
    })
  } catch (error) {
    console.error('Error generating budget report:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/budgets/:id/status - Obtener estado específico de presupuesto
 */
export async function getBudgetStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const { year, month } = req.query
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Verificar que el presupuesto existe y el usuario tiene acceso
    const budget = await BudgetService.getBudgetById(id)
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos
    if (userRole === UserRole.USUARIO_BASICO && budget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este presupuesto'
      })
    }

    const status = await BudgetService.calculateBudgetStatus(
      id,
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined
    )

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo calcular el estado del presupuesto'
      })
    }

    res.json({
      success: true,
      data: status,
      message: 'Estado de presupuesto obtenido exitosamente'
    })
  } catch (error) {
    console.error('Error getting budget status:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * POST /api/v1/budgets/:id/check-alerts - Verificar alertas de presupuesto
 */
export async function checkBudgetAlerts(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Verificar que el presupuesto existe
    const budget = await BudgetService.getBudgetById(id)
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos
    if (userRole === UserRole.USUARIO_BASICO && budget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para verificar alertas de este presupuesto'
      })
    }

    await BudgetService.checkBudgetAlerts(id)

    res.json({
      success: true,
      message: 'Alertas de presupuesto verificadas exitosamente'
    })
  } catch (error) {
    console.error('Error checking budget alerts:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * GET /api/v1/budgets/:id/recurring/preview - Vista previa de presupuestos recurrentes
 */
export async function getRecurringPreview(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Verificar que el presupuesto existe y el usuario tiene acceso
    const budget = await BudgetService.getBudgetById(id)
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos
    if (userRole === UserRole.USUARIO_BASICO && budget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este presupuesto'
      })
    }

    if (!budget.isRecurring) {
      return res.status(400).json({
        success: false,
        message: 'Este presupuesto no es recurrente'
      })
    }

    const preview = await RecurringBudgetService.getRecurringPreview(id)

    res.json({
      success: true,
      data: preview,
      message: 'Vista previa de presupuestos recurrentes generada exitosamente'
    })
  } catch (error) {
    console.error('Error getting recurring preview:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * POST /api/v1/budgets/:id/recurring/generate - Generar presupuestos recurrentes manualmente
 */
export async function generateRecurringBudgets(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole

    // Verificar que el presupuesto existe y el usuario tiene acceso
    const budget = await BudgetService.getBudgetById(id)
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      })
    }

    // Verificar permisos (solo ADMIN y COLABORADOR pueden generar)
    if (userRole === UserRole.USUARIO_BASICO) {
      return res.status(403).json({
        success: false,
        message: 'Los usuarios básicos no pueden generar presupuestos recurrentes'
      })
    }

    // COLABORADOR solo puede generar sus propios presupuestos
    if (userRole === UserRole.COLABORADOR && budget.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes generar tus propios presupuestos recurrentes'
      })
    }

    if (!budget.isRecurring) {
      return res.status(400).json({
        success: false,
        message: 'Este presupuesto no es recurrente'
      })
    }

    await RecurringBudgetService.generateRecurringBudgets(id)

    res.json({
      success: true,
      message: 'Presupuestos recurrentes generados exitosamente'
    })
  } catch (error) {
    console.error('Error generating recurring budgets:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * POST /api/v1/budgets/cleanup-duplicates - Limpiar presupuestos duplicados
 */
export async function cleanupDuplicateBudgets(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId
    const userRole = req.user!.role as UserRole
    const { categoryId } = req.body

    // Verificar permisos (solo ADMIN y COLABORADOR pueden limpiar)
    if (userRole === UserRole.USUARIO_BASICO) {
      return res.status(403).json({
        success: false,
        message: 'Los usuarios básicos no pueden limpiar presupuestos duplicados'
      })
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'categoryId es requerido'
      })
    }

    const deletedCount = await RecurringBudgetService.cleanupDuplicateBudgets(userId, categoryId)

    res.json({
      success: true,
      data: { deletedCount },
      message: `Se limpiaron ${deletedCount} presupuestos duplicados`
    })
  } catch (error) {
    console.error('Error cleaning up duplicate budgets:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
} 