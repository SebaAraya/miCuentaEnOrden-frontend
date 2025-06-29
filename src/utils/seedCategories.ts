import db from '../config/database.js'

/**
 * Categorías por defecto del sistema
 */
const defaultCategories = [
  {
    name: 'Alimentación',
    description: 'Gastos en comida y bebidas',
    colorHex: '#EF4444',
    icon: '🍽️',
    isDefault: true
  },
  {
    name: 'Transporte',
    description: 'Gastos en transporte público, combustible, etc.',
    colorHex: '#3B82F6',
    icon: '🚗',
    isDefault: true
  },
  {
    name: 'Vivienda',
    description: 'Alquiler, servicios, mantenimiento del hogar',
    colorHex: '#10B981',
    icon: '🏠',
    isDefault: true
  },
  {
    name: 'Salud',
    description: 'Gastos médicos, medicamentos, seguros',
    colorHex: '#F59E0B',
    icon: '⚕️',
    isDefault: true
  },
  {
    name: 'Entretenimiento',
    description: 'Ocio, cine, deportes, hobbies',
    colorHex: '#8B5CF6',
    icon: '🎬',
    isDefault: true
  },
  {
    name: 'Educación',
    description: 'Cursos, libros, material educativo',
    colorHex: '#06B6D4',
    icon: '📚',
    isDefault: true
  },
  {
    name: 'Compras',
    description: 'Ropa, accesorios, artículos personales',
    colorHex: '#EC4899',
    icon: '🛍️',
    isDefault: true
  },
  {
    name: 'Servicios',
    description: 'Internet, teléfono, suscripciones',
    colorHex: '#6B7280',
    icon: '📱',
    isDefault: true
  },
  {
    name: 'Ingresos Laborales',
    description: 'Salario, bonos, comisiones',
    colorHex: '#22C55E',
    icon: '💼',
    isDefault: true
  },
  {
    name: 'Otros Ingresos',
    description: 'Inversiones, regalos, ingresos extra',
    colorHex: '#84CC16',
    icon: '💰',
    isDefault: true
  }
]

/**
 * Crea las categorías por defecto si no existen
 */
export async function seedDefaultCategories(): Promise<void> {
  try {
    console.log('🌱 Verificando categorías por defecto...')

    for (const categoryData of defaultCategories) {
      // Verificar si la categoría ya existe
      const existingCategory = await db.category.findFirst({
        where: {
          name: categoryData.name,
          isDefault: true
        }
      })

      if (!existingCategory) {
        await db.category.create({
          data: {
            ...categoryData,
            organizationId: null // Las categorías por defecto no pertenecen a ninguna organización
          }
        })
        console.log(`✅ Categoría creada: ${categoryData.name}`)
      } else {
        console.log(`⏭️ Categoría ya existe: ${categoryData.name}`)
      }
    }

    console.log('🌱 Seed de categorías completado exitosamente')
  } catch (error) {
    console.error('❌ Error al crear categorías por defecto:', error)
    throw error
  }
}

/**
 * Ejecutar seed si se llama directamente
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDefaultCategories()
    .then(() => {
      console.log('✅ Seed completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error)
      process.exit(1)
    })
} 