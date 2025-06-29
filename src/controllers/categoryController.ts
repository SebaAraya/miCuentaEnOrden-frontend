import { Request, Response } from 'express'
import db from '../config/database.js'
import type { AuthenticatedRequest } from '../types/index.js'
import { validateCategoryName, validateColorHex } from '../utils/financial.js'

/**
 * Obtener todas las categorías
 */
export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
}

/**
 * Obtener categoría por ID
 */
export const getCategoryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    const category = await db.category.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId }
        ]
      }
    })

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    res.json({
      success: true,
      data: category,
      message: 'Categoría obtenida exitosamente'
    })
  } catch (error) {
    console.error('Error getting category:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * Crear nueva categoría
 */
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, colorHex = '#6B7280', icon = '💰' } = req.body
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    // Validaciones
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      })
      return
    }

    const nameValidation = validateCategoryName(name)
    if (!nameValidation.isValid) {
      res.status(400).json({
        success: false,
        message: nameValidation.error
      })
      return
    }

    if (colorHex) {
      const colorValidation = validateColorHex(colorHex)
      if (!colorValidation.isValid) {
        res.status(400).json({
          success: false,
          message: colorValidation.error
        })
        return
      }
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingCategory = await db.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId }
        ]
      }
    })

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
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
}

/**
 * Actualizar categoría
 */
export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description, colorHex, icon, isActive } = req.body
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    // Verificar que la categoría existe
    const existingCategory = await db.category.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId }
        ]
      }
    })

    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    // No permitir editar categorías por defecto
    if (existingCategory.isDefault) {
      res.status(403).json({
        success: false,
        message: 'No se pueden editar las categorías por defecto'
      })
      return
    }

    // Validaciones
    if (name) {
      const nameValidation = validateCategoryName(name)
      if (!nameValidation.isValid) {
        res.status(400).json({
          success: false,
          message: nameValidation.error
        })
        return
      }

      // Verificar que no exista otra categoría con el mismo nombre
      const duplicateCategory = await db.category.findFirst({
        where: {
          id: { not: id },
          name: {
            equals: name.trim(),
            mode: 'insensitive'
          },
          isActive: true,
          OR: [
            { isDefault: true },
            { organizationId: organizationId }
          ]
        }
      })

      if (duplicateCategory) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        })
        return
      }
    }

    if (colorHex) {
      const colorValidation = validateColorHex(colorHex)
      if (!colorValidation.isValid) {
        res.status(400).json({
          success: false,
          message: colorValidation.error
        })
        return
      }
    }

    // Actualizar categoría
    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(colorHex && { colorHex }),
        ...(icon && { icon }),
        ...(isActive !== undefined && { isActive })
      }
    })

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Categoría actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

/**
 * Eliminar categoría (soft delete)
 */
export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    // Verificar que la categoría existe
    const category = await db.category.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId }
        ]
      }
    })

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    // No permitir eliminar categorías por defecto
    if (category.isDefault) {
      res.status(403).json({
        success: false,
        message: 'No se pueden eliminar las categorías por defecto'
      })
      return
    }

    // Verificar que no tenga transacciones asociadas
    const transactionCount = await db.transaction.count({
      where: {
        categoryId: id,
        userId: userId
      }
    })

    if (transactionCount > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene transacciones asociadas'
      })
      return
    }

    // Verificar que no tenga presupuestos asociados
    const budgetCount = await db.budget.count({
      where: {
        categoryId: id,
        userId: userId
      }
    })

    if (budgetCount > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene presupuestos asociados'
      })
      return
    }

    // Soft delete
    await db.category.update({
      where: { id },
      data: { isActive: false }
    })

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
} 