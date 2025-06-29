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
    const userId = req.user!.userId
    const userRole = req.user!.role as string
    const userOrgId = req.user!.organizationId
    const {
      type,
      categoryId,
      startDate,
      endDate,
      organizationId,
      page = '1',
      limit = '20'
    } = req.query

    // Validar selección de organización según rol
    if (userRole === 'ADMIN') {
      // ADMIN debe seleccionar una organización
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Los administradores deben seleccionar una organización para ver las transacciones'
        })
      }
    } else if (userRole === 'COLABORADOR') {
      // COLABORADOR debe seleccionar una organización si pertenece a más de una
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Debes seleccionar una organización para ver las transacciones'
        })
      }
      
      // Verificar que el COLABORADOR puede acceder a esa organización
      if (organizationId !== userOrgId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a las transacciones de esta organización'
        })
      }
    }

    // Construir filtros según rol
    let where: any = {}

    if (userRole === 'ADMIN') {
      // ADMIN ve transacciones de la organización seleccionada
      where.user = {
        organizationId: organizationId as string
      }
    } else if (userRole === 'COLABORADOR') {
      // COLABORADOR ve transacciones de su organización
      where.user = {
        organizationId: userOrgId
      }
    } else {
      // USUARIO_BASICO ve todas las transacciones de su organización
      where.user = {
        organizationId: userOrgId
      }
    }

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filtros de fecha
    if (startDate || endDate) {
      where.transactionDate = {}
      
      if (startDate) {
        const startDateObj = new Date(startDate as string)
        startDateObj.setHours(0, 0, 0, 0)
        where.transactionDate.gte = startDateObj
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate as string)
        endDateObj.setHours(23, 59, 59, 999)
        where.transactionDate.lte = endDateObj
      }
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              organizationId: true
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
    const { amount, type, description, transactionDate, categoryId } = req.body
    const userId = req.user!.userId
    const userRole = req.user!.role as string
    
    // Validaciones básicas
    if (!amount || !type || !description || !transactionDate || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      })
    }

    // Validar monto
    const amountValidation = validateAmount(amount)
    if (!amountValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.error
      })
    }

    // Validar tipo
    if (!Object.values(TransactionType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de transacción inválido'
      })
    }

    // Validar descripción
    const descriptionValidation = validateDescription(description)
    if (!descriptionValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: descriptionValidation.error
      })
    }

    // Validar fecha
    const date = new Date(transactionDate)
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de transacción inválida'
      })
    }

    // Validaciones específicas para USUARIO_BASICO
    if (userRole === 'USUARIO_BASICO') {
      const now = new Date()
      const transactionDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // Solo puede crear transacciones de hoy (dentro del rango de 1 día)
      const diffInDays = Math.abs((transactionDateOnly.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays > 1) {
        return res.status(403).json({
          success: false,
          message: 'Los usuarios básicos solo pueden crear transacciones dentro de 1 día desde hoy'
        })
      }
    }
    
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
    console.error('Error creating transaction:', error)
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
    const userId = req.user!.userId
    const userRole = req.user!.role as string
    const userOrgId = req.user!.organizationId
    
    // Verificar que la transacción existe
    const existingTransaction = await db.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            organizationId: true
          }
        }
      }
    })

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      })
    }

    // Verificar permisos según rol
    if (userRole === 'ADMIN') {
      // ADMIN puede editar cualquier transacción (sin restricciones adicionales por ahora)
    } else if (userRole === 'COLABORADOR') {
      // COLABORADOR puede editar transacciones de su organización
      if (existingTransaction.user.organizationId !== userOrgId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar transacciones de otra organización'
        })
      }
    } else if (userRole === 'USUARIO_BASICO') {
      // USUARIO_BASICO solo puede editar sus propias transacciones
      if (existingTransaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes editar tus propias transacciones'
        })
      }

      // Validar que la transacción fue creada dentro del rango permitido (1 día)
      const now = new Date()
      const transactionCreatedAt = new Date(existingTransaction.createdAt)
      const diffInHours = Math.abs((now.getTime() - transactionCreatedAt.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours > 24) {
        return res.status(403).json({
          success: false,
          message: 'Los usuarios básicos solo pueden editar transacciones creadas en las últimas 24 horas'
        })
      }
    }

    // Validaciones básicas
    if (!amount || !type || !description || !transactionDate || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      })
    }

    // Validar monto
    const amountValidation = validateAmount(amount)
    if (!amountValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.error
      })
    }

    // Validar tipo
    if (!Object.values(TransactionType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de transacción inválido'
      })
    }

    // Validar descripción
    const descriptionValidation = validateDescription(description)
    if (!descriptionValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: descriptionValidation.error
      })
    }

    // Validar fecha
    const date = new Date(transactionDate)
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de transacción inválida'
      })
    }

    // Validaciones específicas para USUARIO_BASICO en la nueva fecha
    if (userRole === 'USUARIO_BASICO') {
      const now = new Date()
      const transactionDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const diffInDays = Math.abs((transactionDateOnly.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays > 1) {
        return res.status(403).json({
          success: false,
          message: 'Los usuarios básicos solo pueden editar transacciones con fecha dentro de 1 día desde hoy'
        })
      }
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
    const userId = req.user!.userId
    const userRole = req.user!.role as string
    const userOrgId = req.user!.organizationId

    // Verificar que la transacción existe
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            organizationId: true
          }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      })
    }

    // Verificar permisos según rol
    if (userRole === 'ADMIN') {
      // ADMIN puede eliminar cualquier transacción
    } else if (userRole === 'COLABORADOR') {
      // COLABORADOR puede eliminar transacciones de su organización
      if (transaction.user.organizationId !== userOrgId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar transacciones de otra organización'
        })
      }
    } else if (userRole === 'USUARIO_BASICO') {
      // USUARIO_BASICO solo puede eliminar sus propias transacciones
      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes eliminar tus propias transacciones'
        })
      }

      // Validar que la transacción fue creada dentro del rango permitido (1 día)
      const now = new Date()
      const transactionCreatedAt = new Date(transaction.createdAt)
      const diffInHours = Math.abs((now.getTime() - transactionCreatedAt.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours > 24) {
        return res.status(403).json({
          success: false,
          message: 'Los usuarios básicos solo pueden eliminar transacciones creadas en las últimas 24 horas'
        })
      }
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