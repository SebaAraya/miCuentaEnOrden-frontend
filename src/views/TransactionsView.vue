<template>
  <!-- Selector de organización cuando es requerido -->
  <OrganizationPicker v-if="authStore.requiresOrganizationSelection" />

  <AppLayout v-else>
    <!-- Header de la página -->
    <!-- Header Section Rediseñado -->
    <div class="page-header mb-5">
      <div class="row align-items-center">
        <div class="col-lg-8">
          <div class="header-actions">
            <div class="d-grid gap-2 d-md-flex">
              <div class="header-icon">
                <i class="bi bi-arrow-left-right"></i>
              </div>
              <div class="ms-2 d-flex align-items-center">
                <div>
                  <h1 class="header-title mb-1">Transacciones</h1>
                  <p v-if="authStore.selectedOrganization" class="mb-0 text-muted small">
                    <i class="bi bi-building me-1"></i>
                    {{ authStore.selectedOrganization.name }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="header-actions">
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <!-- <button class="btn btn-outline-primary" type="button">
                <i class="bi bi-download me-2"></i>
                Exportar
              </button> -->
              <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#transactionModal"
                @click="openCreateModal">
                <i class="bi bi-plus-lg me-2"></i>
                Nueva Transacción
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Resumen -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card border-0 shadow-sm text-center h-100">
          <div class="card-body d-flex flex-column justify-content-center">
            <i class="bi bi-arrow-up-circle-fill text-success fs-1 mb-2"></i>
            <h6 class="text-muted mb-1">Total Ingresos</h6>
            <h4 class="text-success mb-0 fw-bold">{{ formatCurrency(totalIncome) }}</h4>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card border-0 shadow-sm text-center h-100">
          <div class="card-body d-flex flex-column justify-content-center">
            <i class="bi bi-arrow-down-circle-fill text-danger fs-1 mb-2"></i>
            <h6 class="text-muted mb-1">Total Gastos</h6>
            <h4 class="text-danger mb-0 fw-bold">{{ formatCurrency(totalExpenses) }}</h4>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-12 col-lg-4">
        <div class="card border-0 shadow-sm text-center h-100">
          <div class="card-body d-flex flex-column justify-content-center">
            <i class="bi bi-wallet2 fs-1 mb-2" :class="netAmount >= 0 ? 'text-success' : 'text-danger'"></i>
            <h6 class="text-muted mb-1">Balance</h6>
            <h4 class="mb-0 fw-bold" :class="netAmount >= 0 ? 'text-success' : 'text-danger'">
              {{ formatCurrency(netAmount) }}
            </h4>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="row mb-3">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <!-- Filtros superiores -->
            <div class="row g-3 mb-0">
              <div class="col-6 col-md-3">
                <label class="form-label">Tipo</label>
                <select v-model="filters.type" class="form-select" @change="applyFilters">
                  <option value="">Todos</option>
                  <option value="INCOME">Ingresos</option>
                  <option value="EXPENSE">Gastos</option>
                </select>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Categoría</label>
                <select v-model="filters.categoryId" class="form-select" @change="applyFilters">
                  <option value="">Todas</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.icon }} {{ category.name }}
                  </option>
                </select>
              </div>
              <div class="col-6 col-md-3">
                <DatePicker v-model="filters.startDate" label="Fecha desde" icon="bi bi-calendar-range"
                  placeholder="Seleccionar fecha inicial" :clearable="true" size="sm" @change="applyFilters"
                  @clear="applyFilters" />
              </div>
              <div class="col-6 col-md-3">
                <DatePicker v-model="filters.endDate" label="Fecha hasta" icon="bi bi-calendar-range"
                  placeholder="Seleccionar fecha final" :clearable="true" size="sm" @change="applyFilters"
                  @clear="applyFilters" />
              </div>
              <!-- Botón limpiar filtros para móvil -->
              <div class="col-12 d-md-none">
                <button v-if="transactions.length > 0" @click="clearFilters" class="btn btn-outline-secondary w-100">
                  <i class="bi bi-x-circle me-2"></i>
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de transacciones -->
    <div class="row">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-0">
            <div
              class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
              <h5 class="card-title mb-0">
                <i class="bi bi-list-ul me-2"></i>
                <span class="d-none d-sm-inline">Transacciones ({{ transactions.length }})</span>
                <span class="d-sm-none">Transacciones</span>
              </h5>
              <button v-if="transactions.length > 0" @click="clearFilters"
                class="btn btn-outline-secondary btn-sm d-none d-md-block">
                <i class="bi bi-x-circle me-1"></i>
                Limpiar filtros
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-3 text-muted">Cargando transacciones...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="alert alert-danger m-3" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <!-- Empty state -->
            <div v-else-if="!hasTransactions" class="text-center py-5">
              <i class="bi bi-receipt text-muted" style="font-size: 4rem;"></i>
              <h5 class="text-muted mt-3">No hay transacciones</h5>
              <p class="text-muted">Comienza agregando tu primera transacción</p>
              <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#transactionModal"
                @click="openCreateModal">
                <i class="bi bi-plus-lg me-2"></i>
                Agregar Transacción
              </button>
            </div>

            <!-- Transactions list -->
            <div v-else>
              <!-- Desktop table -->
              <div class="d-none d-md-block">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Tipo</th>
                        <th class="text-end">Monto</th>
                        <th class="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="transaction in transactions" :key="transaction.id">
                        <td>
                          <small class="text-muted">{{ formatDateForDisplay(transaction.transactionDate) }}</small>
                        </td>
                        <td>
                          <div class="fw-medium">{{ transaction.description }}</div>
                        </td>
                        <td>
                          <span class="badge" :style="{
                            backgroundColor: getCategoryById(transaction.categoryId)?.colorHex + '20',
                            color: getCategoryById(transaction.categoryId)?.colorHex,
                            border: `1px solid ${getCategoryById(transaction.categoryId)?.colorHex}40`
                          }">
                            {{ getCategoryById(transaction.categoryId)?.icon }}
                            {{ getCategoryById(transaction.categoryId)?.name }}
                          </span>
                        </td>
                        <td>
                          <span class="badge"
                            :class="transaction.type === 'INCOME' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                            <i :class="getTransactionTypeIcon(transaction.type)"></i>
                            {{ transaction.type === 'INCOME' ? 'Ingreso' : 'Gasto' }}
                          </span>
                        </td>
                        <td class="text-end">
                          <span class="fw-medium" :class="getTransactionTypeClass(transaction.type)">
                            {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                          </span>
                        </td>
                        <td class="text-center">
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" @click="openEditModal(transaction)"
                              data-bs-toggle="modal" data-bs-target="#transactionModal">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" @click="confirmDelete(transaction)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Mobile cards -->
              <div class="d-md-none">
                <div class="row g-3">
                  <div v-for="transaction in transactions" :key="`mobile-${transaction.id}`" class="col-12">
                    <div class="card border-0 shadow-sm transaction-card">
                      <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <div class="flex-grow-1">
                            <h6 class="mb-1 fw-bold">{{ transaction.description }}</h6>
                            <small class="text-muted">
                              <i class="bi bi-calendar3 me-1"></i>
                              {{ formatDateForDisplay(transaction.transactionDate) }}
                            </small>
                          </div>
                          <div class="text-end">
                            <div class="fw-bold fs-5 mb-1" :class="getTransactionTypeClass(transaction.type)">
                              {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                            </div>
                            <span class="badge"
                              :class="transaction.type === 'INCOME' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                              <i :class="getTransactionTypeIcon(transaction.type)"></i>
                              {{ transaction.type === 'INCOME' ? 'Ingreso' : 'Gasto' }}
                            </span>
                          </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center">
                          <span class="badge" :style="{
                            backgroundColor: getCategoryById(transaction.categoryId)?.colorHex + '20',
                            color: getCategoryById(transaction.categoryId)?.colorHex,
                            border: `1px solid ${getCategoryById(transaction.categoryId)?.colorHex}40`
                          }">
                            {{ getCategoryById(transaction.categoryId)?.icon }}
                            {{ getCategoryById(transaction.categoryId)?.name }}
                          </span>

                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" @click="openEditModal(transaction)"
                              data-bs-toggle="modal" data-bs-target="#transactionModal">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" @click="confirmDelete(transaction)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de transacción -->
    <div class="modal fade" id="transactionModal" ref="transactionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle me-2"></i>
              {{ isEditing ? 'Editar' : 'Nueva' }} Transacción
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Tipo *</label>
                  <select v-model="form.type" class="form-select" :class="{ 'is-invalid': formErrors.type }" required>
                    <option value="">Seleccionar tipo</option>
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Gasto</option>
                  </select>
                  <div v-if="formErrors.type" class="invalid-feedback">{{ formErrors.type }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Monto *</label>
                  <input v-model="form.amount" type="number" step="1" min="1" class="form-control"
                    :class="{ 'is-invalid': formErrors.amount }" placeholder="0" required>
                  <div v-if="formErrors.amount" class="invalid-feedback">{{ formErrors.amount }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Descripción *</label>
                  <input v-model="form.description" type="text" class="form-control"
                    :class="{ 'is-invalid': formErrors.description }" placeholder="Ej: Supermercado, Salario, etc."
                    maxlength="255" required>
                  <div v-if="formErrors.description" class="invalid-feedback">{{ formErrors.description }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Categoría *</label>
                  <select v-model="form.categoryId" class="form-select" :class="{ 'is-invalid': formErrors.categoryId }"
                    required>
                    <option value="">Seleccionar categoría</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.icon }} {{ category.name }}
                    </option>
                  </select>
                  <div v-if="formErrors.categoryId" class="invalid-feedback">{{ formErrors.categoryId }}</div>
                </div>
                <div class="col-md-6">
                  <DatePicker v-model="form.transactionDate" label="Fecha" icon="bi bi-calendar-event"
                    placeholder="Seleccionar fecha de transacción" :required="true" :clearable="false"
                    :error-message="formErrors.transactionDate" help-text="Fecha en que se realizó la transacción"
                    variant="primary" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div class="modal fade" id="deleteConfirmModal" ref="deleteConfirmModal" tabindex="-1">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title text-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Confirmar eliminación
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <p class="mb-1">¿Estás seguro de eliminar esta transacción?</p>
            <p class="text-muted small mb-0">Esta acción no se puede deshacer</p>
            <div v-if="transactionToDelete" class="mt-3 p-3 bg-light rounded">
              <div class="fw-medium">{{ transactionToDelete.description }}</div>
              <div class="text-muted">{{ formatCurrency(transactionToDelete.amount) }}</div>
            </div>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="deleting">
              <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useAuthStore } from '@/stores/auth'
import type { Transaction, TransactionType, CreateTransactionRequest } from '@/types/financial'
import {
  formatCurrency,
  formatDateForDisplay,
  formatDateForInput,
  formatDateForBackend,
  getTransactionTypeIcon,
  getTransactionTypeClass,
  getCurrentDateForInput,
  validateAmount,
  validateDescription
} from '@/services/financialService'
import DatePicker from '@/components/forms/DatePicker.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import OrganizationPicker from '@/components/forms/OrganizationPicker.vue'

// Composables
const authStore = useAuthStore()
const {
  transactions,
  loading,
  error,
  hasTransactions,
  totalIncome,
  totalExpenses,
  netAmount,
  fetchTransactions,
  addTransaction,
  editTransaction,
  removeTransaction,
  clearFilters: clearTransactionFilters
} = useTransactions()

const transactionModal = ref(null)
const deleteConfirmModal = ref(null)

const {
  categories,
  fetchCategories,
  getCategoryById
} = useCategories()

// Estado para verificar inicialización
const isInitialized = ref(false)

// Estado local
const isEditing = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const submitting = ref(false)
const deleting = ref(false)
const transactionToDelete = ref<Transaction | null>(null)

// Filtros
// Función para obtener las fechas del mes actual en zona horaria local
function getCurrentMonthDates() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Primer día del mes
  const firstDay = new Date(year, month, 1)
  const startDate = formatDateForInput(firstDay)

  // Último día del mes
  const lastDay = new Date(year, month + 1, 0)
  const endDate = formatDateForInput(lastDay)

  return { startDate, endDate }
}

const { startDate: currentMonthStart, endDate: currentMonthEnd } = getCurrentMonthDates()

const filters = reactive({
  type: '',
  categoryId: '',
  startDate: currentMonthStart,
  endDate: currentMonthEnd
})

// Formulario
const form = reactive({
  type: '' as TransactionType | '',
  amount: '',
  description: '',
  categoryId: '',
  transactionDate: getCurrentDateForInput()
})

const formErrors = reactive({
  type: '',
  amount: '',
  description: '',
  categoryId: '',
  transactionDate: ''
})

// Métodos
function clearFormErrors() {
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = ''
  })
}

function validateForm(): boolean {
  clearFormErrors()
  let isValid = true

  if (!form.type) {
    formErrors.type = 'El tipo es requerido'
    isValid = false
  }

  const amountValidation = validateAmount(form.amount)
  if (!amountValidation.isValid) {
    formErrors.amount = amountValidation.error || 'Monto inválido'
    isValid = false
  }

  const descriptionValidation = validateDescription(form.description)
  if (!descriptionValidation.isValid) {
    formErrors.description = descriptionValidation.error || 'Descripción inválida'
    isValid = false
  }

  if (!form.categoryId) {
    formErrors.categoryId = 'La categoría es requerida'
    isValid = false
  }

  if (!form.transactionDate) {
    formErrors.transactionDate = 'La fecha es requerida'
    isValid = false
  }

  return isValid
}

function resetForm() {
  form.type = ''
  form.amount = ''
  form.description = ''
  form.categoryId = ''
  form.transactionDate = getCurrentDateForInput()
  clearFormErrors()
}

function openCreateModal() {
  isEditing.value = false
  editingTransaction.value = null
  resetForm()
}

function openEditModal(transaction: Transaction) {
  isEditing.value = true
  editingTransaction.value = transaction

  form.type = transaction.type
  form.amount = transaction.amount
  form.description = transaction.description
  form.categoryId = transaction.categoryId
  form.transactionDate = formatDateForInput(transaction.transactionDate)

  clearFormErrors()
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    submitting.value = true

    const transactionData: CreateTransactionRequest = {
      type: form.type as TransactionType,
      amount: parseFloat(form.amount),
      description: form.description.trim(),
      categoryId: form.categoryId,
      transactionDate: formatDateForBackend(form.transactionDate)
    }

    if (isEditing.value && editingTransaction.value) {
      await editTransaction(editingTransaction.value.id, transactionData)
    } else {
      await addTransaction(transactionData)
    }

    // Cerrar modal usando ref
    if (transactionModal.value) {
      const modal = transactionModal.value as HTMLElement
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      if (bootstrapModal) {
        bootstrapModal.hide()
      } else {
        // Fallback: intentar crear nueva instancia y cerrar
        try {
          const newBootstrapModal = new (window as any).bootstrap.Modal(modal)
          newBootstrapModal.hide()
        } catch (error) {
          console.error('No se pudo cerrar el modal automáticamente:', error)
          // Fallback manual usando el ref
          const closeButton = modal.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement
          if (closeButton) {
            closeButton.click()
          }
        }
      }
    }

    resetForm()
  } catch (error) {
    console.error('Error al guardar transacción:', error)
  } finally {
    submitting.value = false
  }
}

function confirmDelete(transaction: Transaction) {
  transactionToDelete.value = transaction
  if (deleteConfirmModal.value) {
    const modal = deleteConfirmModal.value as HTMLElement
    try {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal)
      bootstrapModal.show()
    } catch (error) {
      console.error('Error al mostrar modal de confirmación:', error)
      // Fallback: usar confirm nativo
      if (confirm(`¿Estás seguro de eliminar la transacción "${transaction.description}"?\nEsta acción no se puede deshacer.`)) {
        removeTransaction(transaction.id)
      }
    }
  }
}

async function handleDelete() {
  if (!transactionToDelete.value) return

  try {
    deleting.value = true
    await removeTransaction(transactionToDelete.value.id)

    // Cerrar modal usando ref
    if (deleteConfirmModal.value) {
      const modal = deleteConfirmModal.value as HTMLElement
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      if (bootstrapModal) {
        bootstrapModal.hide()
      } else {
        // Fallback manual usando el ref
        const closeButton = modal.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    transactionToDelete.value = null
  } catch (error) {
    console.error('Error al eliminar transacción:', error)
  } finally {
    deleting.value = false
  }
}

function applyFilters() {
  const activeFilters: any = {}

  if (filters.type && filters.type.trim() !== '') {
    activeFilters.type = filters.type
  }
  if (filters.categoryId) activeFilters.categoryId = filters.categoryId
  if (filters.startDate) activeFilters.startDate = filters.startDate
  if (filters.endDate) activeFilters.endDate = filters.endDate

  // Agregar organizationId para ADMIN y COLABORADOR
  if (authStore.userRole === 'ADMIN' || authStore.userRole === 'COLABORADOR') {
    if (authStore.selectedOrganizationId) {
      activeFilters.organizationId = authStore.selectedOrganizationId
    }
  }

  fetchTransactions(activeFilters)
}

function clearFilters() {
  filters.type = ''
  filters.categoryId = ''

  // Restablecer a las fechas del mes actual
  const { startDate, endDate } = getCurrentMonthDates()
  filters.startDate = startDate
  filters.endDate = endDate

  // Aplicar filtros limpios directamente (incluye organizationId automáticamente)
  // NO llamamos a clearTransactionFilters() para evitar llamadas dobles
  applyFilters()
}

async function initializeData() {
  // Cargar organizaciones disponibles si es necesario ANTES de verificar requiresOrganizationSelection
  if (authStore.userRole === 'ADMIN' || authStore.userRole === 'COLABORADOR') {
    await authStore.fetchAvailableOrganizations()
  }

  // Cargar categorías
  await fetchCategories()

  // Después de cargar organizaciones, verificar si cargar transacciones
  if (!authStore.requiresOrganizationSelection) {
    applyFilters()
  }

  isInitialized.value = true
}

// Watcher para recargar cuando se seleccione organización
watch(() => authStore.selectedOrganizationId, (newOrgId) => {
  if (newOrgId && isInitialized.value) {
    applyFilters()
  }
})

// Lifecycle
onMounted(async () => {
  await initializeData()
})
</script>
<style scoped>
/* Header Section Moderno */
.page-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(229, 231, 235, 0.5);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(50%, -50%);
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.4);
  position: relative;
}

.header-icon::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-radius: 1rem;
  z-index: -1;
  opacity: 0.3;
  filter: blur(8px);
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.025em;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.breadcrumb-item {
  color: #9ca3af;
  transition: color 0.2s ease;
}

.breadcrumb-item.active {
  color: #22c55e;
  font-weight: 600;
}

.breadcrumb-item:hover:not(.active) {
  color: #6b7280;
}

.header-breadcrumb i {
  font-size: 0.75rem;
  color: #d1d5db;
}

.header-description {
  font-size: 1.125rem;
  color: #4b5563;
  line-height: 1.6;
  max-width: 600px;
}

.header-actions {
  position: relative;
  z-index: 2;
}

.header-actions .btn {
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-actions .btn-primary {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.4);
}

.header-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4);
}

.header-actions .btn-outline-primary {
  border: 2px solid #22c55e;
  color: #22c55e;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.header-actions .btn-outline-primary:hover {
  background: #22c55e;
  color: white;
  transform: translateY(-2px);
}

/* Quick Stats */
.quick-stats {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.stat-mini {
  text-align: center;
  padding: 0.75rem 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

.stat-mini:hover {
  transform: translateY(-2px);
}

.stat-mini-value {
  font-size: 0.875rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  letter-spacing: -0.025em;
}

.stat-mini-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Estilos existentes mejorados */
.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: none;
  color: #374151;
  padding: 1rem;
}

.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}

.transaction-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0.75rem;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.transaction-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: rgba(34, 197, 94, 0.3);
}

.btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.form-control,
.form-select {
  transition: all 0.2s ease;
  border-radius: 0.5rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* Responsive */
@media (max-width: 991.98px) {
  .page-header {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .header-title {
    font-size: 1.75rem;
  }

  .header-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .quick-stats {
    margin-top: 1.5rem;
  }

  .header-actions .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 767.98px) {
  .page-header {
    padding: 1rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .d-flex.align-items-center {
    flex-direction: column;
    text-align: center;
  }

  .header-icon {
    margin-bottom: 1rem;
  }

  .ms-3 {
    margin-left: 0 !important;
  }
}

/* Accesibilidad */
@media (prefers-reduced-motion: reduce) {

  .page-header,
  .header-icon,
  .stat-mini,
  .card,
  .btn {
    transition: none !important;
  }

  .page-header::before {
    display: none;
  }
}
</style>