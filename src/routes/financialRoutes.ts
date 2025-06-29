import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import type { AuthenticatedRequest } from '../types/index.js'
import db from '../config/database.js'
import { validateAmount, validateDescription, decimalToString } from '../utils/financial.js'
import { TransactionType } from '../types/financial.js'

const router = Router()

// ========================================
// RUTAS DE CATEGORÍAS
// ========================================

/**
 * GET /api/v1/financial/categories - Obtener categorías
 */
router.get('/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    const categories = await db.category.findMany({
      where: {
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId }
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    res.json({
      success: true,
      data: categories,
      message: 'Categorías obtenidas exitosamente'
    })
  } catch (error) {
    console.error('Error getting categories:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * POST /api/v1/financial/categories - Crear categoría
 */
router.post('/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, colorHex = '#6B7280', icon = '💰' } = req.body
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      })
      return
    }

    // Crear categoría
    const category = await db.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        colorHex,
        icon,
        isDefault: false,
        organizationId: organizationId
      }
    })

    res.status(201).json({
      success: true,
      data: category,
      message: 'Categoría creada exitosamente'
    })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ========================================
// RUTAS DE TRANSACCIONES
// ========================================

/**
 * GET /api/v1/financial/transactions - Obtener transacciones
 */
router.get('/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      type,
      categoryId,
      page = '1',
      limit = '20'
    } = req.query

    // Construir filtros
    const where: any = { userId }

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    // Paginación
    const pageNum = parseInt(page as string) || 1
    const limitNum = Math.min(parseInt(limit as string) || 20, 100)
    const skip = (pageNum - 1) * limitNum

    // Obtener transacciones
    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              colorHex: true,
              icon: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limitNum
      }),
      db.transaction.count({ where })
    ])

    // Convertir Decimal a string para JSON
    const transactionsWithStringAmounts = transactions.map(transaction => ({
      ...transaction,
      amount: decimalToString(transaction.amount)
    }))

    res.json({
      success: true,
      data: {
        transactions: transactionsWithStringAmounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Transacciones obtenidas exitosamente'
    })
  } catch (error) {
    console.error('Error getting transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * POST /api/v1/financial/transactions - Crear transacción
 */
router.post('/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== CREATING TRANSACTION ===')
    console.log('req.body', req.body)
    console.log('req.user', req.user)
    
    const { amount, type, description, transactionDate, categoryId } = req.body
    const userId = req.user!.userId
    
    console.log('Extracted data:', { amount, type, description, transactionDate, categoryId, userId })
    console.log('🔍 Iniciando validaciones...')
    
    // Validaciones básicas
    console.log('📋 Validando campos requeridos...')
    if (!amount || !type || !description || !transactionDate || !categoryId) {
      console.log('❌ Faltan campos requeridos:', { amount: !!amount, type: !!type, description: !!description, transactionDate: !!transactionDate, categoryId: !!categoryId })
      res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      })
      return
    }
    console.log('✅ Todos los campos requeridos están presentes')

    // Validar monto
    const amountValidation = validateAmount(amount)
    if (!amountValidation.isValid) {
      res.status(400).json({
        success: false,
        message: amountValidation.error
      })
      return
    }

    // Validar tipo
    if (!Object.values(TransactionType).includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Tipo de transacción inválido'
      })
      return
    }

    // Validar descripción
    const descriptionValidation = validateDescription(description)
    if (!descriptionValidation.isValid) {
      res.status(400).json({
        success: false,
        message: descriptionValidation.error
      })
      return
    }

    // Validar fecha
    const date = new Date(transactionDate)
    if (isNaN(date.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Fecha de transacción inválida'
      })
      return
    }

    // Crear transacción
    console.log('💾 Intentando crear transacción en la base de datos...')
    console.log('Datos para crear:', {
      amount: amountValidation.normalizedAmount!.toString(),
      type,
      description: description.trim(),
      transactionDate: date.toISOString(),
      categoryId,
      userId
    })
    
    const transaction = await db.transaction.create({
      data: {
        amount: amountValidation.normalizedAmount!,
        type,
        description: description.trim(),
        transactionDate: date,
        categoryId,
        userId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            colorHex: true,
            icon: true
          }
        }
      }
    })
    
    console.log('✅ Transacción creada exitosamente:', transaction.id)

    const transactionWithStringAmount = {
      ...transaction,
      amount: decimalToString(transaction.amount)
    }

    res.status(201).json({
      success: true,
      data: transactionWithStringAmount,
      message: 'Transacción creada exitosamente'
    })
  } catch (error) {
    console.error('❌ ERROR CREATING TRANSACTION ❌')
    console.error('Error type:', typeof error)
    console.error('Error instance:', error instanceof Error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
    console.error('Full error object:', error)
    
    // Log additional context
    console.error('Request data that caused error:', {
      userId: req.user?.id,
      body: req.body
    })
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * PUT /api/v1/financial/transactions/:id - Actualizar transacción
 */
router.put('/transactions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { amount, type, description, transactionDate, categoryId } = req.body
    const userId = req.user!.user

    console.log('req.body', req.body)
    console.log('req.user', req.user)
    console.log('req.params', req.params)
    console.log('id', id)
    console.log('userId', userId)
    
    // Verificar que la transacción existe y pertenece al usuario
    const existingTransaction = await db.transaction.findFirst({
      where: { id, userId }
    })

    if (!existingTransaction) {
      res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      })
      return
    }

    // Validaciones básicas
    if (!amount || !type || !description || !transactionDate || !categoryId) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      })
      return
    }

    // Validar monto
    const amountValidation = validateAmount(amount)
    if (!amountValidation.isValid) {
      res.status(400).json({
        success: false,
        message: amountValidation.error
      })
      return
    }

    // Validar tipo
    if (!Object.values(TransactionType).includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Tipo de transacción inválido'
      })
      return
    }

    // Validar descripción
    const descriptionValidation = validateDescription(description)
    if (!descriptionValidation.isValid) {
      res.status(400).json({
        success: false,
        message: descriptionValidation.error
      })
      return
    }

    // Validar fecha
    const date = new Date(transactionDate)
    if (isNaN(date.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Fecha de transacción inválida'
      })
      return
    }

    // Actualizar transacción
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: {
        amount: amountValidation.normalizedAmount!,
        type,
        description: description.trim(),
        transactionDate: date,
        categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            colorHex: true,
            icon: true
          }
        }
      }
    })

    const transactionWithStringAmount = {
      ...updatedTransaction,
      amount: decimalToString(updatedTransaction.amount)
    }

    res.json({
      success: true,
      data: transactionWithStringAmount,
      message: 'Transacción actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * DELETE /api/v1/financial/transactions/:id - Eliminar transacción
 */
router.delete('/transactions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.user

    console.log('remove id', id)
    // Verificar que la transacción existe y pertenece al usuario
    const transaction = await db.transaction.findFirst({
      where: { id, userId }
    })

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      })
      return
    }

    // Eliminar transacción
    await db.transaction.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Transacción eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/v1/financial/summary - Obtener resumen financiero
 */
router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    // Obtener resumen del mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const where = {
      userId,
      transactionDate: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }

    const [incomeResult, expenseResult, totalCount] = await Promise.all([
      db.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
        _count: true
      }),
      db.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: true
      }),
      db.transaction.count({ where })
    ])

    const totalIncome = incomeResult._sum.amount || 0
    const totalExpenses = expenseResult._sum.amount || 0
    const netAmount = Number(totalIncome) - Number(totalExpenses)

    res.json({
      success: true,
      data: {
        totalIncome: decimalToString(totalIncome),
        totalExpenses: decimalToString(totalExpenses),
        netAmount: netAmount.toFixed(2),
        incomeCount: incomeResult._count,
        expenseCount: expenseResult._count,
        totalCount,
        period: {
          startDate: startOfMonth,
          endDate: endOfMonth
        }
      },
      message: 'Resumen obtenido exitosamente'
    })
  } catch (error) {
    console.error('Error getting summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

export default router 