<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="h3 mb-1">Gestión de Categorías</h1>
            <p class="text-muted mb-0">Administra las categorías de ingresos y gastos</p>
          </div>
          <button 
            class="btn btn-primary"
            @click="showCreateModal = true"
            :disabled="loading"
          >
            <i class="bi bi-plus-circle me-2"></i>
            Nueva Categoría
          </button>
        </div>

        <!-- Filtros -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Buscar</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Buscar por nombre..."
                  v-model="searchTerm"
                >
              </div>
              <div class="col-md-3">
                <label class="form-label">Tipo</label>
                <select class="form-select" v-model="selectedType">
                  <option value="">Todos</option>
                  <option value="income">Ingresos</option>
                  <option value="expense">Gastos</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Origen</label>
                <select class="form-select" v-model="selectedOrigin">
                  <option value="">Todos</option>
                  <option value="default">Por defecto</option>
                  <option value="custom">Personalizadas</option>
                </select>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button class="btn btn-outline-secondary" @click="clearFilters">
                  <i class="bi bi-x-circle me-1"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card bg-primary text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h4 class="mb-0">{{ totalCategories }}</h4>
                    <p class="mb-0">Total</p>
                  </div>
                  <i class="bi bi-grid-3x3-gap fs-1 opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card bg-success text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h4 class="mb-0">{{ incomeCategories.length }}</h4>
                    <p class="mb-0">Ingresos</p>
                  </div>
                  <i class="bi bi-arrow-up-circle fs-1 opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card bg-danger text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h4 class="mb-0">{{ expenseCategories.length }}</h4>
                    <p class="mb-0">Gastos</p>
                  </div>
                  <i class="bi bi-arrow-down-circle fs-1 opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card bg-info text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h4 class="mb-0">{{ customCategories.length }}</h4>
                    <p class="mb-0">Personalizadas</p>
                  </div>
                  <i class="bi bi-gear fs-1 opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
          {{ error }}
          <button type="button" class="btn-close" @click="clearError"></button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-content-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>

        <!-- Tabla de Categorías -->
        <div v-else class="card">
          <div class="card-body">
            <div v-if="filteredCategories.length === 0" class="text-center py-5">
              <i class="bi bi-grid-3x3-gap fs-1 text-muted mb-3"></i>
              <h5 class="text-muted">No se encontraron categorías</h5>
              <p class="text-muted mb-0">
                {{ searchTerm || selectedType || selectedOrigin ? 'Intenta ajustar los filtros' : 'Comienza creando tu primera categoría' }}
              </p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Creada</th>
                    <th width="120">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="category in filteredCategories" :key="category.id">
                    <td>
                      <div class="d-flex align-items-center">
                        <div 
                          class="rounded-circle me-3 d-flex align-items-center justify-content-center"
                          :style="{ backgroundColor: category.colorHex, width: '40px', height: '40px' }"
                        >
                          <span class="text-white fw-bold">{{ category.icon }}</span>
                        </div>
                        <div>
                          <div class="fw-semibold">{{ category.name }}</div>
                          <small class="text-muted" v-if="category.description">{{ category.description }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        :class="category.isIncomeCategory ? 'badge bg-success' : 'badge bg-danger'"
                      >
                        <i :class="category.isIncomeCategory ? 'bi bi-arrow-up-circle' : 'bi bi-arrow-down-circle'" class="me-1"></i>
                        {{ category.isIncomeCategory ? 'Ingreso' : 'Gasto' }}
                      </span>
                    </td>
                    <td>
                      <span 
                        :class="category.isDefault ? 'badge bg-primary' : 'badge bg-secondary'"
                      >
                        {{ category.isDefault ? 'Por defecto' : 'Personalizada' }}
                      </span>
                    </td>
                    <td>
                      <span 
                        :class="category.isActive ? 'badge bg-success' : 'badge bg-warning'"
                      >
                        {{ category.isActive ? 'Activa' : 'Inactiva' }}
                      </span>
                    </td>
                    <td>
                      <small class="text-muted">{{ formatDate(category.createdAt) }}</small>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button 
                          class="btn btn-outline-primary"
                          @click="editCategory(category)"
                          :disabled="category.isDefault"
                          title="Editar"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button 
                          class="btn btn-outline-danger"
                          @click="confirmDelete(category)"
                          :disabled="category.isDefault"
                          title="Eliminar"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Creación/Edición -->
    <CategoryForm 
      :show="showCreateModal || showEditModal"
      :category="editingCategory"
      @close="closeModal"
      @saved="onCategorySaved"
    />

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar Eliminación</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que quieres eliminar la categoría <strong>{{ categoryToDelete?.name }}</strong>?</p>
            <p class="text-muted mb-0">Esta acción no se puede deshacer. Asegúrate de que no haya transacciones o presupuestos asociados a esta categoría.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancelar</button>
            <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCategories } from '@/composables/useCategories'
import type { Category } from '@/types/financial'
import CategoryForm from '@/components/forms/CategoryForm.vue'
import { formatDateForDisplay } from '@/utils/dateUtils'

// Composables
const { 
  categories, 
  loading, 
  error, 
  customCategories,
  incomeCategories,
  expenseCategories,
  fetchCategories,
  removeCategory,
  clearError
} = useCategories()

// Estado local
const searchTerm = ref('')
const selectedType = ref('')
const selectedOrigin = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryToDelete = ref<Category | null>(null)

// Computed
const totalCategories = computed(() => categories.value.length)

const filteredCategories = computed(() => {
  let filtered = categories.value

  // Filtro de búsqueda
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(category => 
      category.name.toLowerCase().includes(term) ||
      category.description?.toLowerCase().includes(term)
    )
  }

  // Filtro de tipo
  if (selectedType.value) {
    if (selectedType.value === 'income') {
      filtered = filtered.filter(category => category.isIncomeCategory)
    } else if (selectedType.value === 'expense') {
      filtered = filtered.filter(category => !category.isIncomeCategory)
    }
  }

  // Filtro de origen
  if (selectedOrigin.value) {
    if (selectedOrigin.value === 'default') {
      filtered = filtered.filter(category => category.isDefault)
    } else if (selectedOrigin.value === 'custom') {
      filtered = filtered.filter(category => !category.isDefault)
    }
  }

  return filtered
})

// Métodos
function clearFilters() {
  searchTerm.value = ''
  selectedType.value = ''
  selectedOrigin.value = ''
}

function editCategory(category: Category) {
  editingCategory.value = category
  showEditModal.value = true
}

function confirmDelete(category: Category) {
  categoryToDelete.value = category
  showDeleteModal.value = true
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  editingCategory.value = null
}

async function handleDelete() {
  if (!categoryToDelete.value) return

  try {
    await removeCategory(categoryToDelete.value.id)
    showDeleteModal.value = false
    categoryToDelete.value = null
  } catch (err) {
    // Error manejado por el composable
  }
}

function onCategorySaved() {
  closeModal()
  fetchCategories() // Recargar la lista
}

function formatDate(dateString: string): string {
  return formatDateForDisplay(dateString)
}

// Lifecycle
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
}

.btn-group-sm > .btn {
  padding: 0.25rem 0.5rem;
}

.modal.show {
  display: block !important;
}

.card-body .table-responsive {
  margin: -1rem -1rem 0 -1rem;
}

.card-body .table-responsive .table {
  margin-bottom: 0;
}

.badge {
  font-size: 0.75rem;
}
</style>