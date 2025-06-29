import db from '../config/database.js'
import type { 
  ICategory, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryWithStats 
} from '../types/financial.js'
import { 
  validateCategoryName, 
  validateColorHex,
  decimalToString 
} from '../utils/financial.js'

export class CategoryService {
  /**
   * Obtener todas las categorías del usuario/organización
   */
  async getCategories(
    userId: string, 
    organizationId?: string,
    includeStats = false
  ): Promise<CategoryWithStats[]> {
    const where = {
      isActive: true,
      OR: [
        { isDefault: true }, // Categorías por defecto
        { organizationId: organizationId || null }, // Categorías de la organización
      ]
    }

    const categories = await db.category.findMany({
      where,
      include: includeStats ? {
        transactions: {
          where: { userId },
          select: {
            amount: true,
            type: true
          }
        },
        budgets: {
          where: { userId },
          select: { id: true }
        }
      } : undefined,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return categories.map(category => {
      const result: CategoryWithStats = {
        id: category.id,
        name: category.name,
        description: category.description,
        colorHex: category.colorHex,
        icon: category.icon,
        isDefault: category.isDefault,
        organizationId: category.organizationId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        isActive: category.isActive
      }

      if (includeStats && 'transactions' in category) {
        result.transactionCount = category.transactions.length
        
        const totalAmount = category.transactions.reduce((sum, t) => {
          return sum.plus(t.amount)
        }, new (require('@prisma/client/runtime/library')).Decimal(0))
        
        result.totalAmount = decimalToString(totalAmount)
        result.budgetCount = category.budgets?.length || 0
      }

      return result
    })
  }

  /**
   * Obtener una categoría por ID
   */
  async getCategoryById(
    categoryId: string, 
    userId: string, 
    organizationId?: string
  ): Promise<ICategory | null> {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId || null }
        ]
      }
    })

    return category as ICategory | null
  }

  /**
   * Crear nueva categoría
   */
  async createCategory(
    data: CreateCategoryRequest,
    userId: string,
    organizationId?: string
  ): Promise<ICategory> {
    // Validaciones
    const nameValidation = validateCategoryName(data.name)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }

    if (data.colorHex) {
      const colorValidation = validateColorHex(data.colorHex)
      if (!colorValidation.isValid) {
        throw new Error(colorValidation.error)
      }
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: data.name.trim(),
          mode: 'insensitive'
        },
        isActive: true,
        OR: [
          { isDefault: true },
          { organizationId: organizationId || null }
        ]
      }
    })

    if (existingCategory) {
      throw new Error('Ya existe una categoría con ese nombre')
    }

    // Crear categoría
    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        colorHex: data.colorHex || '#6B7280',
        icon: data.icon || '💰',
        isDefault: false,
        organizationId: organizationId || null
      }
    })

    return category as ICategory
  }

  /**
   * Actualizar categoría
   */
  async updateCategory(
    categoryId: string,
    data: UpdateCategoryRequest,
    userId: string,
    organizationId?: string
  ): Promise<ICategory> {
    // Verificar que la categoría existe y pertenece al usuario/organización
    const existingCategory = await this.getCategoryById(categoryId, userId, organizationId)
    if (!existingCategory) {
      throw new Error('Categoría no encontrada')
    }

    // No permitir editar categorías por defecto
    if (existingCategory.isDefault) {
      throw new Error('No se pueden editar las categorías por defecto')
    }

    // Validaciones
    if (data.name) {
      const nameValidation = validateCategoryName(data.name)
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error)
      }

      // Verificar que no exista otra categoría con el mismo nombre
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          id: { not: categoryId },
          name: {
            equals: data.name.trim(),
            mode: 'insensitive'
          },
          isActive: true,
          OR: [
            { isDefault: true },
            { organizationId: organizationId || null }
          ]
        }
      })

      if (duplicateCategory) {
        throw new Error('Ya existe una categoría con ese nombre')
      }
    }

    if (data.colorHex) {
      const colorValidation = validateColorHex(data.colorHex)
      if (!colorValidation.isValid) {
        throw new Error(colorValidation.error)
      }
    }

    // Actualizar categoría
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        ...(data.colorHex && { colorHex: data.colorHex }),
        ...(data.icon && { icon: data.icon }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })

    return updatedCategory as ICategory
  }

  /**
   * Eliminar categoría (soft delete)
   */
  async deleteCategory(
    categoryId: string,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    // Verificar que la categoría existe
    const category = await this.getCategoryById(categoryId, userId, organizationId)
    if (!category) {
      throw new Error('Categoría no encontrada')
    }

    // No permitir eliminar categorías por defecto
    if (category.isDefault) {
      throw new Error('No se pueden eliminar las categorías por defecto')
    }

    // Verificar que no tenga transacciones asociadas
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId: categoryId,
        userId: userId
      }
    })

    if (transactionCount > 0) {
      throw new Error('No se puede eliminar una categoría que tiene transacciones asociadas')
    }

    // Verificar que no tenga presupuestos asociados
    const budgetCount = await prisma.budget.count({
      where: {
        categoryId: categoryId,
        userId: userId
      }
    })

    if (budgetCount > 0) {
      throw new Error('No se puede eliminar una categoría que tiene presupuestos asociados')
    }

    // Soft delete
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false }
    })
  }

  /**
   * Obtener categorías por defecto para seeds
   */
  static getDefaultCategories(): CreateCategoryRequest[] {
    return [
      {
        name: 'Alimentación',
        description: 'Gastos en comida y bebidas',
        colorHex: '#EF4444',
        icon: '🍽️'
      },
      {
        name: 'Transporte',
        description: 'Gastos en transporte público, combustible, etc.',
        colorHex: '#3B82F6',
        icon: '🚗'
      },
      {
        name: 'Vivienda',
        description: 'Alquiler, servicios, mantenimiento del hogar',
        colorHex: '#10B981',
        icon: '🏠'
      },
      {
        name: 'Salud',
        description: 'Gastos médicos, medicamentos, seguros',
        colorHex: '#F59E0B',
        icon: '⚕️'
      },
      {
        name: 'Entretenimiento',
        description: 'Ocio, cine, deportes, hobbies',
        colorHex: '#8B5CF6',
        icon: '🎬'
      },
      {
        name: 'Educación',
        description: 'Cursos, libros, material educativo',
        colorHex: '#06B6D4',
        icon: '📚'
      },
      {
        name: 'Compras',
        description: 'Ropa, accesorios, artículos personales',
        colorHex: '#EC4899',
        icon: '🛍️'
      },
      {
        name: 'Servicios',
        description: 'Internet, teléfono, suscripciones',
        colorHex: '#6B7280',
        icon: '📱'
      },
      {
        name: 'Ingresos Laborales',
        description: 'Salario, bonos, comisiones',
        colorHex: '#22C55E',
        icon: '💼'
      },
      {
        name: 'Otros Ingresos',
        description: 'Inversiones, regalos, ingresos extra',
        colorHex: '#84CC16',
        icon: '💰'
      }
    ]
  }
}

export default new CategoryService() 