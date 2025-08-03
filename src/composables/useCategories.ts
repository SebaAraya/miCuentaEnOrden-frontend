import { ref, computed, watch, type Ref } from 'vue'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/financial'
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryById } from '@/services/financialService'
import { useAuthStore } from '@/stores/auth'

export function useCategories() {
  const authStore = useAuthStore()
  
  // Estado reactivo
  const categories: Ref<Category[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Computed para obtener organización seleccionada
  const selectedOrganizationId = computed(() => {
    return authStore.selectedOrganizationId
  })

  // Computed
  const hasCategories = computed(() => categories.value.length > 0)
  const defaultCategories = computed(() => categories.value.filter(c => c.isDefault))
  const customCategories = computed(() => categories.value.filter(c => !c.isDefault))
  const activeCategories = computed(() => categories.value.filter(c => c.isActive))
  const incomeCategories = computed(() => categories.value.filter(c => c.isIncomeCategory && c.isActive))
  const expenseCategories = computed(() => categories.value.filter(c => !c.isIncomeCategory && c.isActive))

  // Métodos
  async function fetchCategories() {
    try {
      loading.value = true
      error.value = null

      const result = await getCategories(selectedOrganizationId.value || undefined)
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

      const newCategory = await createCategory(categoryData, selectedOrganizationId.value || undefined)
      
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

  async function editCategory(id: string, categoryData: UpdateCategoryRequest) {
    try {
      loading.value = true
      error.value = null

      const updatedCategory = await updateCategory(id, categoryData)
      
      // Actualizar en la lista
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }

      return updatedCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar categoría'
      console.error('Error updating category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeCategory(id: string) {
    try {
      loading.value = true
      error.value = null

      await deleteCategory(id)
      
      // Remover de la lista
      categories.value = categories.value.filter(c => c.id !== id)

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar categoría'
      console.error('Error deleting category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getCategoryDetails(id: string) {
    try {
      loading.value = true
      error.value = null

      const category = await getCategoryById(id)
      return category
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al obtener categoría'
      console.error('Error getting category details:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function getCategoryByIdLocal(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  function getCategoryByName(name: string): Category | undefined {
    return categories.value.find(c => c.name.toLowerCase() === name.toLowerCase())
  }

  function clearError() {
    error.value = null
  }

  // Watch para recargar cuando cambie la organización
  watch(selectedOrganizationId, async (newOrgId, oldOrgId) => {
    if (newOrgId !== oldOrgId) {
      await fetchCategories()
    }
  })

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
    incomeCategories,
    expenseCategories,
    selectedOrganizationId,

    // Métodos
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
    getCategoryDetails,
    getCategoryByIdLocal,
    getCategoryByName,
    clearError,
    getCategoryOptions,
    getCategoryStyle,
    getCategoryBadgeClass
  }
} 