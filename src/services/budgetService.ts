import { prisma } from '../config/database.js'
import { UserRole } from '../types/index.js'
import { Decimal } from '@prisma/client/runtime/library'
import { RecurringBudgetService } from './recurringBudgetService.js'
import { normalizeDateForDB, normalizeEndDateForDB, getMonthDateRange } from '../utils/dateUtils.js'

export interface CreateBudgetRequest {
  name: string
  description?: string
  monthlyAmount: number
  categoryId: string
  startDate: string
  endDate?: string
  alertThreshold?: number
  // Campos de recurrencia
  isRecurring?: boolean
  recurringMonths?: number
  autoAdjust?: string
}

export interface UpdateBudgetRequest {
  name?: string
  description?: string
  monthlyAmount?: number
  categoryId?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  alertThreshold?: number
  // Campos de recurrencia
  isRecurring?: boolean
  recurringMonths?: number
  autoAdjust?: string
}

export interface BudgetWithStatus {
  id: string
  name: string
  description?: string
  monthlyAmount: Decimal
  alertThreshold: Decimal
  startDate: Date
  endDate?: Date
  isActive: boolean
  // Campos de recurrencia
  isRecurring: boolean
  recurringMonths?: number
  autoAdjust: string
  parentBudgetId?: string
  category: {
    id: string
    name: string
    icon: string
    colorHex: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  currentMonthStatus?: {
    budgetedAmount: Decimal
    spentAmount: Decimal
    remainingAmount: Decimal
    percentageUsed: Decimal
    status: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface BudgetReport {
  totalBudgets: number
  totalBudgetedAmount: number
  totalSpentAmount: number
  totalRemainingAmount: number
  averageUsagePercentage: number
  budgetsByStatus: {
    UNDER_BUDGET: number
    ON_TRACK: number
    WARNING: number
    EXCEEDED: number
  }
  topCategoriesByBudget: Array<{
    categoryId: string
    categoryName: string
    totalBudgeted: number
    totalSpent: number
    percentage: number
  }>
}

/**
 * Servicio para gestión de presupuestos
 */
export class BudgetService {

  /**
   * Crear un nuevo presupuesto
   */
  static async createBudget(data: CreateBudgetRequest, userId: string): Promise<BudgetWithStatus> {
    try {
      // Validar que la categoría existe
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      })

      if (!category) {
        throw new Error('Categoría no encontrada')
      }

      // Normalizar fechas para validación consistente
      const normalizedStartDate = normalizeDateForDB(data.startDate)
      const normalizedEndDate = data.endDate ? normalizeEndDateForDB(data.endDate) : null

      // Verificar restricción única: no puede haber dos presupuestos con la misma categoría y fecha de inicio exacta
      const exactDateBudget = await prisma.budget.findFirst({
        where: {
          userId,
          categoryId: data.categoryId,
          startDate: normalizedStartDate,
          isActive: true
        }
      })

      if (exactDateBudget) {
        throw new Error('Ya existe un presupuesto para esta categoría con la misma fecha de inicio')
      }

      // Verificar que no existe otro presupuesto activo que se superponga en el período
      const overlappingBudget = await prisma.budget.findFirst({
        where: {
          userId,
          categoryId: data.categoryId,
          isActive: true,
          AND: [
            { startDate: { lte: normalizedStartDate } },
            {
              OR: [
                { endDate: null },
                { endDate: { gte: normalizedStartDate } }
              ]
            }
          ]
        }
      })

      if (overlappingBudget) {
        throw new Error('Ya existe un presupuesto activo para esta categoría en el período especificado')
      }

      const budget = await prisma.budget.create({
        data: {
          name: data.name,
          description: data.description,
          monthlyAmount: new Decimal(data.monthlyAmount),
          categoryId: data.categoryId,
          userId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          alertThreshold: new Decimal(data.alertThreshold || 80.0),
          // Campos de recurrencia
          isRecurring: data.isRecurring || false,
          recurringMonths: data.recurringMonths,
          autoAdjust: data.autoAdjust || 'none'
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              colorHex: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Calcular estado del mes actual
      const currentMonthStatus = await this.calculateBudgetStatus(budget.id)

      // Si es recurrente, generar presupuestos hijos automáticamente
      if (budget.isRecurring) {
        try {
          await RecurringBudgetService.generateRecurringBudgets(budget.id)
          console.log(`✅ Presupuesto recurrente creado: ${budget.name}`)
        } catch (error) {
          console.error('Error generando presupuestos recurrentes:', error)
          // No fallar la creación del presupuesto padre por este error
        }
      }

      return {
        ...budget,
        currentMonthStatus
      } as BudgetWithStatus
    } catch (error) {
      console.error('Error creating budget:', error)
      throw error
    }
  }

  /**
   * Obtener presupuestos según rol y organización
   */
  static async getBudgets(
    userId: string,
    userRole: UserRole,
    organizationId?: string,
    filters?: {
      categoryId?: string
      isActive?: boolean
      page?: number
      limit?: number
      search?: string
      year?: number
      month?: number
    }
  ) {
    try {
      const page = filters?.page || 1
      const limit = Math.min(filters?.limit || 20, 100)
      const skip = (page - 1) * limit

      // Construir filtros base
      let where: any = {}

      // Filtros por rol
      if (userRole === UserRole.ADMIN) {
        // ADMIN puede ver presupuestos de la organización seleccionada
        if (organizationId) {
          where.user = {
            organizationId
          }
        }
      } else if (userRole === UserRole.COLABORADOR) {
        // COLABORADOR ve presupuestos de su organización
        where.user = {
          organizationId
        }
      } else {
        // USUARIO_BASICO solo ve sus propios presupuestos
        where.userId = userId
      }

      // Filtros adicionales
      if (filters?.categoryId) {
        where.categoryId = filters.categoryId
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Filtros por año y mes
      if (filters?.year || filters?.month) {
        const year = filters.year || new Date().getFullYear()
        const month = filters.month || 1
        
        const { start: startDate, end: endDate } = getMonthDateRange(year, month)
        
        console.log(`📅 Filtros de fecha aplicados: ${startDate.toISOString()} - ${endDate.toISOString()}`)
        
        where.AND = [
          ...(where.AND || []),
          { startDate: { lte: endDate } },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      }

      const [budgets, total] = await Promise.all([
        prisma.budget.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                colorHex: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.budget.count({ where })
      ])

      // Agregar estado del mes actual a cada presupuesto
      const budgetsWithStatus = await Promise.all(
        budgets.map(async (budget) => {
          const currentMonthStatus = await this.calculateBudgetStatus(budget.id, filters?.year, filters?.month)
          return {
            ...budget,
            currentMonthStatus
          } as BudgetWithStatus
        })
      )

      return {
        budgets: budgetsWithStatus,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error getting budgets:', error)
      throw new Error('Error obteniendo presupuestos')
    }
  }

  /**
   * Obtener presupuesto por ID
   */
  static async getBudgetById(budgetId: string): Promise<BudgetWithStatus | null> {
    try {
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              colorHex: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!budget) {
        return null
      }

      const currentMonthStatus = await this.calculateBudgetStatus(budget.id)

      return {
        ...budget,
        currentMonthStatus
      } as BudgetWithStatus
    } catch (error) {
      console.error('Error getting budget by ID:', error)
      throw new Error('Error obteniendo presupuesto')
    }
  }

  /**
   * Actualizar presupuesto
   */
  static async updateBudget(
    budgetId: string,
    data: UpdateBudgetRequest
  ): Promise<BudgetWithStatus> {
    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.monthlyAmount !== undefined) updateData.monthlyAmount = new Decimal(data.monthlyAmount)
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
      if (data.startDate !== undefined) updateData.startDate = normalizeDateForDB(data.startDate)
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? normalizeEndDateForDB(data.endDate) : null
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.alertThreshold !== undefined) updateData.alertThreshold = new Decimal(data.alertThreshold)
      // Campos de recurrencia
      if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring
      if (data.recurringMonths !== undefined) updateData.recurringMonths = data.recurringMonths
      if (data.autoAdjust !== undefined) updateData.autoAdjust = data.autoAdjust

      const budget = await prisma.budget.update({
        where: { id: budgetId },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              colorHex: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      const currentMonthStatus = await this.calculateBudgetStatus(budget.id)

      return {
        ...budget,
        currentMonthStatus
      } as BudgetWithStatus
    } catch (error) {
      console.error('Error updating budget:', error)
      throw new Error('Error actualizando presupuesto')
    }
  }

  /**
   * Eliminar presupuesto (soft delete)
   */
  static async deleteBudget(budgetId: string): Promise<boolean> {
    try {
      await prisma.budget.update({
        where: { id: budgetId },
        data: { isActive: false }
      })

      return true
    } catch (error) {
      console.error('Error deleting budget:', error)
      throw new Error('Error eliminando presupuesto')
    }
  }

  /**
   * Calcular estado de presupuesto para un mes específico
   */
  static async calculateBudgetStatus(budgetId: string, year?: number, month?: number) {
    try {
      const currentDate = new Date()
      const targetYear = year || currentDate.getFullYear()
      const targetMonth = month || (currentDate.getMonth() + 1)

      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: { user: true }
      })

      if (!budget) {
        return null
      }

      // Calcular gastos del mes
      const startOfMonth = new Date(targetYear, targetMonth - 1, 1)
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59)

      // LOG de depuración de parámetros
      console.log('[BudgetStatus][DEBUG] Params:', {
        budgetId,
        userId: budget.userId,
        categoryId: budget.categoryId,
        user: budget.user,
        targetYear,
        targetMonth,
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString()
      })

      const monthlyExpenses = await prisma.transaction.aggregate({
        where: {
          // userId: budget.userId,
          user: {
            organizationId: budget.user.organizationId
          },
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth
          },
        },
        _sum: {
          amount: true
        }
      })

      // LOG de depuración de resultado de transacciones
      console.log('[BudgetStatus][DEBUG] monthlyExpenses:', monthlyExpenses)

      const spentAmount = Number(monthlyExpenses._sum.amount || 0)
      // LOG de depuración del monto gastado
      console.log('[BudgetStatus][DEBUG] spentAmount:', spentAmount)

      const budgetedAmount = Number(budget.monthlyAmount)
      const remainingAmount = budgetedAmount - spentAmount
      const percentageUsed = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0

      // Determinar estado
      let status: string
      if (percentageUsed <= 50) {
        status = 'UNDER_BUDGET'
      } else if (percentageUsed <= Number(budget.alertThreshold)) {
        status = 'ON_TRACK'
      } else if (percentageUsed <= 100) {
        status = 'WARNING'
      } else {
        status = 'EXCEEDED'
      }

      return {
        budgetedAmount: new Decimal(budgetedAmount),
        spentAmount: new Decimal(spentAmount),
        remainingAmount: new Decimal(remainingAmount),
        percentageUsed: new Decimal(percentageUsed.toFixed(2)),
        status
      }
    } catch (error) {
      console.error('Error calculating budget status:', error)
      return null
    }
  }

  /**
   * Generar reporte de presupuestos
   */
  static async generateBudgetReport(
    userId?: string,
    organizationId?: string,
    year?: number,
    month?: number
  ): Promise<BudgetReport> {
    try {
      const currentDate = new Date()
      const targetYear = year || currentDate.getFullYear()
      const targetMonth = month || (currentDate.getMonth() + 1)

      console.log('📊 BudgetService.generateBudgetReport - Parámetros:', {
        userId,
        organizationId,
        year,
        month,
        targetYear,
        targetMonth
      })

      // Construir filtros
      let where: any = { isActive: true }

      if (userId) {
        where.userId = userId
      } else if (organizationId) {
        where.user = { organizationId }
      }

      const startOfMonth = new Date(targetYear, targetMonth - 1, 1)
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

      where.AND = [
        { startDate: { lte: endOfMonth } },
        { endDate: { gte: startOfMonth } }
      ]
      
      const budgets = await prisma.budget.findMany({
        where,
        include: {
          category: true,
          user: true
        }
      })

      console.log('📊 Budgets encontrados:', budgets)
      
      // Calcular estadísticas
      const budgetStats = await Promise.all(
        budgets.map(async (budget) => {
          const status = await this.calculateBudgetStatus(budget.id, targetYear, targetMonth)
          return {
            budget,
            status
          }
        })
      )

      const totalBudgets = budgets.length
      const totalBudgetedAmount = budgets.reduce((sum, b) => sum + Number(b.monthlyAmount), 0)
      const totalSpentAmount = budgetStats.reduce((sum, b) => sum + Number(b.status?.spentAmount || 0), 0)
      const totalRemainingAmount = totalBudgetedAmount - totalSpentAmount
      const averageUsagePercentage = budgetStats.reduce((sum, b) => sum + Number(b.status?.percentageUsed || 0), 0) / totalBudgets

      // Contar por estado
      const budgetsByStatus = {
        UNDER_BUDGET: budgetStats.filter(b => b.status?.status === 'UNDER_BUDGET').length,
        ON_TRACK: budgetStats.filter(b => b.status?.status === 'ON_TRACK').length,
        WARNING: budgetStats.filter(b => b.status?.status === 'WARNING').length,
        EXCEEDED: budgetStats.filter(b => b.status?.status === 'EXCEEDED').length
      }

      // Top categorías por presupuesto
      const categoryStats = budgetStats.reduce((acc: any, item) => {
        const categoryId = item.budget.categoryId
        const categoryName = item.budget.category.name
        
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName,
            totalBudgeted: 0,
            totalSpent: 0
          }
        }
        
        acc[categoryId].totalBudgeted += Number(item.budget.monthlyAmount)
        acc[categoryId].totalSpent += Number(item.status?.spentAmount || 0)
        
        return acc
      }, {})

      const topCategoriesByBudget = Object.values(categoryStats)
        .map((cat: any) => ({
          ...cat,
          percentage: cat.totalBudgeted > 0 ? (cat.totalSpent / cat.totalBudgeted) * 100 : 0
        }))
        .sort((a: any, b: any) => b.totalBudgeted - a.totalBudgeted)
        .slice(0, 10)

      return {
        totalBudgets,
        totalBudgetedAmount,
        totalSpentAmount,
        totalRemainingAmount,
        averageUsagePercentage: Number(averageUsagePercentage.toFixed(2)),
        budgetsByStatus,
        topCategoriesByBudget
      }
    } catch (error) {
      console.error('Error generating budget report:', error)
      throw new Error('Error generando reporte de presupuestos')
    }
  }

  /**
   * Verificar y crear alertas de presupuesto
   */
  static async checkBudgetAlerts(budgetId: string) {
    try {
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId }
      })

      if (!budget || !budget.isActive) {
        return
      }

      const status = await this.calculateBudgetStatus(budgetId)

      if (!status) {
        return
      }

      const percentageUsed = Number(status.percentageUsed)
      const alertThreshold = Number(budget.alertThreshold)

      // Crear alerta si se supera el umbral
      if (percentageUsed >= alertThreshold) {
        const existingAlert = await prisma.budgetAlert.findFirst({
          where: {
            budgetId,
            userId: budget.userId,
            alertType: percentageUsed >= 100 ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })

        if (!existingAlert) {
          await prisma.budgetAlert.create({
            data: {
              budgetId,
              userId: budget.userId,
              alertType: percentageUsed >= 100 ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING',
              thresholdAmount: budget.monthlyAmount,
              currentAmount: status.spentAmount,
              message: percentageUsed >= 100 
                ? `Has excedido tu presupuesto "${budget.name}" en un ${(percentageUsed - 100).toFixed(1)}%`
                : `Tu presupuesto "${budget.name}" ha alcanzado el ${percentageUsed.toFixed(1)}% de uso`,
              isRead: false
            }
          })
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error)
    }
  }
} 