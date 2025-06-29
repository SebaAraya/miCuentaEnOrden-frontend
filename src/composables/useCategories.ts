import { ref, computed, type Ref } from 'vue'
import type { Category, CreateCategoryRequest } from '@/types/financial'
import { getCategories, createCategory } from '@/services/financialService'

export function useCategories() {
  // Estado reactivo
  const categories: Ref<Category[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasCategories = computed(() => categories.value.length > 0)
  const defaultCategories = computed(() => categories.value.filter(c => c.isDefault))
  const customCategories = computed(() => categories.value.filter(c => !c.isDefault))
  const activeCategories = computed(() => categories.value.filter(c => c.isActive))

  // Métodos
  async function fetchCategories() {
    try {
      loading.value = true
      error.value = null

      const result = await getCategories()
      categories.value = result
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar categorías'
      console.error('Error fetching categories:', err)
    } finally {
      loading.value = false
    }
  }

  async function addCategory(categoryData: CreateCategoryRequest) {
    try {
      loading.value = true
      error.value = null

      const newCategory = await createCategory(categoryData)
      
      // Agregar a la lista
      categories.value.push(newCategory)

      return newCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear categoría'
      console.error('Error creating category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function getCategoryById(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  function getCategoryByName(name: string): Category | undefined {
    return categories.value.find(c => c.name.toLowerCase() === name.toLowerCase())
  }

  function clearError() {
    error.value = null
  }

  // Métodos de utilidad para UI
  function getCategoryOptions() {
    return activeCategories.value.map(category => ({
      value: category.id,
      text: category.name,
      icon: category.icon,
      color: category.colorHex
    }))
  }

  function getCategoryStyle(category: Category) {
    return {
      backgroundColor: category.colorHex + '20', // 20% opacity
      borderLeft: `4px solid ${category.colorHex}`
    }
  }

  function getCategoryBadgeClass(category: Category) {
    // Determinar si el color es claro u oscuro para el texto
    const hex = category.colorHex.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
    
    return brightness > 155 ? 'text-dark' : 'text-light'
  }

  return {
    // Estado
    categories,
    loading,
    error,

    // Computed
    hasCategories,
    defaultCategories,
    customCategories,
    activeCategories,

    // Métodos
    fetchCategories,
    addCategory,
    getCategoryById,
    getCategoryByName,
    clearError,
    getCategoryOptions,
    getCategoryStyle,
    getCategoryBadgeClass
  }
} 