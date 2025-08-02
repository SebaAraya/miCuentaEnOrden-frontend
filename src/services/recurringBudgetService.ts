import { prisma } from '../config/database.js'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Servicio para gestión de presupuestos recurrentes
 */
export class RecurringBudgetService {

  /**
   * Generar presupuestos hijos para un presupuesto padre recurrente
   */
  static async generateRecurringBudgets(parentBudgetId: string): Promise<void> {
    try {
      const parentBudget = await prisma.budget.findUnique({
        where: { id: parentBudgetId },
        include: { user: true, category: true }
      })

      if (!parentBudget || !parentBudget.isRecurring) {
        throw new Error('Presupuesto padre no encontrado o no es recurrente')
      }

      const currentDate = new Date()
      const startDate = new Date(parentBudget.startDate)
      
      // Calcular cuántos meses generar
      let monthsToGenerate = 12 // Por defecto 12 meses
      if (parentBudget.recurringMonths) {
        monthsToGenerate = parentBudget.recurringMonths
      }

      const budgetsToCreate: any[] = []

      // EMPEZAR DESDE i = 1 para evitar duplicar el mes del presupuesto padre
      for (let i = 1; i < monthsToGenerate; i++) {
        const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
        const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0, 23, 59, 59)

        // VERIFICACIÓN MEJORADA: Buscar presupuestos existentes por categoría, usuario y período
        const existingBudgets = await prisma.budget.findMany({
          where: {
            AND: [
              { userId: parentBudget.userId },
              { categoryId: parentBudget.categoryId },
              { isActive: true },
              {
                OR: [
                  // Presupuestos hijos del mismo padre
                  { parentBudgetId: parentBudgetId },
                  // Presupuestos que se solapan con el período
                  {
                    AND: [
                      { startDate: { lte: monthEnd } },
                      {
                        OR: [
                          { endDate: null },
                          { endDate: { gte: monthStart } }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        })

        // Si ya existe un presupuesto para este período y categoría, saltar
        if (existingBudgets.length > 0) {
          console.log(`⚠️  Ya existe presupuesto para ${parentBudget.category.name} en ${monthStart.toISOString().split('T')[0]}`)
          continue
        }

        // Calcular monto ajustado
        let adjustedAmount = parentBudget.monthlyAmount

        if (parentBudget.autoAdjust === 'inflation' && i > 0) {
          // Aplicar 3% de inflación por cada mes
          const inflationRate = 0.03
          adjustedAmount = new Decimal(Number(parentBudget.monthlyAmount) * Math.pow(1 + inflationRate, i))
        } else if (parentBudget.autoAdjust === 'previous' && i > 0) {
          // Basado en gasto anterior (implementar lógica más adelante)
          adjustedAmount = parentBudget.monthlyAmount
        }

        // Generar nombre único para el mes
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        const monthName = monthNames[monthStart.getMonth()]
        const year = monthStart.getFullYear()
        const childName = `${parentBudget.category.name} - ${monthName} ${year}`

        budgetsToCreate.push({
          name: childName,
          description: `Presupuesto generado automáticamente para ${monthName} ${year}`,
          monthlyAmount: adjustedAmount,
          categoryId: parentBudget.categoryId,
          userId: parentBudget.userId,
          startDate: monthStart,
          endDate: monthEnd,
          alertThreshold: parentBudget.alertThreshold,
          isRecurring: false, // Los hijos no son recurrentes
          autoAdjust: 'none',
          parentBudgetId: parentBudgetId,
          isActive: true
        })
      }

      // Crear todos los presupuestos hijos en una transacción
      if (budgetsToCreate.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const budgetData of budgetsToCreate) {
            await tx.budget.create({ data: budgetData })
          }
        })

        console.log(`✅ Generados ${budgetsToCreate.length} presupuestos recurrentes para ${parentBudget.name}`)
      } else {
        console.log(`ℹ️  No se generaron presupuestos adicionales para ${parentBudget.name} (ya existen)`)
      }

    } catch (error) {
      console.error('Error generando presupuestos recurrentes:', error)
      throw error
    }
  }

  /**
   * Verificar y limpiar presupuestos duplicados
   */
  static async cleanupDuplicateBudgets(userId: string, categoryId: string): Promise<number> {
    try {
      // Buscar presupuestos duplicados para la misma categoría, usuario y período
      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          categoryId,
          isActive: true
        },
        orderBy: { createdAt: 'asc' }
      })

      const toDelete: string[] = []
      const processed: Set<string> = new Set()

      for (const budget of budgets) {
        const monthKey = `${budget.startDate.getFullYear()}-${budget.startDate.getMonth()}`
        
        if (processed.has(monthKey)) {
          // Es un duplicado, marcar para eliminación
          toDelete.push(budget.id)
        } else {
          processed.add(monthKey)
        }
      }

      if (toDelete.length > 0) {
        await prisma.budget.updateMany({
          where: { id: { in: toDelete } },
          data: { isActive: false }
        })

        console.log(`🧹 Limpiados ${toDelete.length} presupuestos duplicados`)
      }

      return toDelete.length
    } catch (error) {
      console.error('Error limpiando duplicados:', error)
      throw error
    }
  }

  /**
   * Obtener vista previa de presupuestos que se generarían
   */
  static async getRecurringPreview(parentBudgetId: string) {
    try {
      const parentBudget = await prisma.budget.findUnique({
        where: { id: parentBudgetId },
        include: { category: true }
      })

      if (!parentBudget || !parentBudget.isRecurring) {
        throw new Error('Presupuesto padre no encontrado o no es recurrente')
      }

      const startDate = new Date(parentBudget.startDate)
      const monthsToGenerate = parentBudget.recurringMonths || 12

      const preview = []

      // EMPEZAR DESDE i = 1 para no incluir el mes del presupuesto padre
      for (let i = 1; i < monthsToGenerate; i++) {
        const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
        
        // Calcular monto ajustado
        let adjustedAmount = Number(parentBudget.monthlyAmount)

        if (parentBudget.autoAdjust === 'inflation' && i > 0) {
          const inflationRate = 0.03
          adjustedAmount = Number(parentBudget.monthlyAmount) * Math.pow(1 + inflationRate, i)
        }

        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        const monthName = monthNames[monthStart.getMonth()]
        const year = monthStart.getFullYear()

        preview.push({
          month: `${monthName} ${year}`,
          amount: adjustedAmount,
          period: `${monthStart.toISOString().split('T')[0]} - ${new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0).toISOString().split('T')[0]}`
        })
      }

      return preview
    } catch (error) {
      console.error('Error generando vista previa:', error)
      throw error
    }
  }

  /**
   * Eliminar presupuestos hijos futuros (para modificaciones)
   */
  static async deleteFutureChildren(parentBudgetId: string): Promise<void> {
    try {
      const currentDate = new Date()
      
      await prisma.budget.updateMany({
        where: {
          parentBudgetId: parentBudgetId,
          startDate: {
            gt: currentDate
          }
        },
        data: {
          isActive: false
        }
      })

      console.log(`✅ Presupuestos futuros desactivados para presupuesto padre ${parentBudgetId}`)
    } catch (error) {
      console.error('Error eliminando presupuestos futuros:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de presupuestos recurrentes
   */
  static async getRecurringStats(userId?: string, organizationId?: string) {
    try {
      let where: any = { isRecurring: true, isActive: true }

      if (userId) {
        where.userId = userId
      } else if (organizationId) {
        where.user = { organizationId }
      }

      const recurringBudgets = await prisma.budget.count({ where })
      
      const childBudgets = await prisma.budget.count({
        where: {
          parentBudgetId: { not: null },
          isActive: true,
          ...(userId ? { userId } : organizationId ? { user: { organizationId } } : {})
        }
      })

      return {
        totalRecurringBudgets: recurringBudgets,
        totalGeneratedBudgets: childBudgets
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      throw error
    }
  }
} 