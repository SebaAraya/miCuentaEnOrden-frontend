<template>
  <div class="modal fade" :id="modalId" tabindex="-1" aria-labelledby="transactionModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="transactionModalLabel">{{ isEditing ? 'Editar Transacción' : 'Nueva Transacción'
            }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Error/Success Messages -->
          <div v-if="modalError" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ modalError }}
          </div>

          <div v-if="modalSuccess" class="alert alert-success" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            {{ modalSuccess }}
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- Tipo de transacción -->
            <div class="mb-3">
              <label for="transactionType" class="form-label">Tipo de transacción</label>
              <select id="transactionType" v-model="form.type" class="form-select" :class="{
                'border-success': form.type === 'INCOME',
                'border-danger': form.type === 'EXPENSE'
              }" required>
                <option value="">Selecciona un tipo</option>
                <option value="INCOME">💰 Ingreso</option>
                <option value="EXPENSE">💸 Gasto</option>
              </select>
            </div>

            <!-- Monto -->
            <div class="mb-3">
              <label for="transactionAmount" class="form-label">Monto</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" id="transactionAmount" v-model.number="form.amount" class="form-control"
                  placeholder="0" min="0" step="1" required />
              </div>
            </div>

            <!-- Descripción -->
            <div class="mb-3">
              <label for="transactionDescription" class="form-label">Descripción</label>
              <input type="text" id="transactionDescription" v-model="form.description" class="form-control"
                placeholder="Ej: Compra en supermercado" required />
            </div>

            <!-- Categoría -->
            <div class="mb-3">
              <label for="transactionCategory" class="form-label">Categoría</label>
              <select id="transactionCategory" v-model="form.categoryId" class="form-select" :class="{
                'border-success': form.type === 'INCOME',
                'border-danger': form.type === 'EXPENSE'
              }" :disabled="!form.type" required>
                <option value="">{{ form.type ? 'Selecciona una categoría' : 'Primero selecciona el tipo de transacción'
                  }}</option>
                <option v-for="category in filteredCategories" :key="category.id" :value="category.id">
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
              <div v-if="form.type" class="form-text">
                Mostrando {{ filteredCategories.length }} categorías de {{ form.type === 'INCOME' ? 'ingresos' :
                  'gastos' }}
              </div>
            </div>

            <!-- Fecha -->
            <div class="mb-3">
              <DatePicker v-model="form.transactionDate" label="Fecha de transacción" icon="bi bi-calendar-event"
                placeholder="Seleccionar fecha" :required="true" :clearable="false"
                help-text="Fecha en que se realizó la transacción" variant="primary" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" :disabled="submissionLoading || !isFormValid" @click="handleSubmit"
            class="btn btn-primary">
            <span v-if="submissionLoading" class="spinner-border spinner-border-sm me-2" role="status"
              aria-hidden="true"></span>
            {{ submissionLoading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ?
              'Actualizar Transacción' : 'Crear Transacción') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { formatDateForInput, formatDateForBackend } from '@/utils/dateUtils'
import { useCategories } from '@/composables/useCategories'
import { useTransactions } from '@/composables/useTransactions'
import type { CreateTransactionRequest, UpdateTransactionRequest, Transaction } from '@/types/financial'
import { Modal } from '@/utils/bootstrap'
import DatePicker from '@/components/forms/DatePicker.vue'

interface Props {
  modalId?: string
  editingTransaction?: Transaction | null
}

interface Emits {
  (e: 'transactionCreated'): void
  (e: 'transactionUpdated'): void
}

const props = withDefaults(defineProps<Props>(), {
  modalId: 'transactionModal'
})

const emit = defineEmits<Emits>()

// Composables
const { categories, incomeCategories, expenseCategories, fetchCategories } = useCategories()
const { addTransaction, editTransaction, loading: submissionLoading } = useTransactions()

// Estado para edición
const isEditing = computed(() => !!props.editingTransaction)

// Form state
const form = ref({
  type: '' as 'INCOME' | 'EXPENSE' | '',
  amount: 0,
  description: '',
  categoryId: '',
  transactionDate: formatDateForInput(new Date())
})

// Modal state
const modalError = ref<string | null>(null)
const modalSuccess = ref<string | null>(null)

// Computed
const isFormValid = computed(() => {
  return form.value.type &&
    form.value.amount > 0 &&
    form.value.description.trim() &&
    form.value.categoryId &&
    form.value.transactionDate
})

const filteredCategories = computed(() => {
  if (!form.value.type) {
    return categories.value
  }

  if (form.value.type === 'INCOME') {
    return incomeCategories.value
  } else if (form.value.type === 'EXPENSE') {
    return expenseCategories.value
  }

  return categories.value
})

// Methods
const resetForm = () => {
  form.value = {
    type: '',
    amount: 0,
    description: '',
    categoryId: '',
    transactionDate: formatDateForInput(new Date())
  }
  modalError.value = null
  modalSuccess.value = null
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    modalError.value = null
    modalSuccess.value = null

    const transactionData = {
      type: form.value.type as 'INCOME' | 'EXPENSE',
      amount: form.value.amount,
      description: form.value.description.trim(),
      categoryId: form.value.categoryId,
      transactionDate: formatDateForBackend(form.value.transactionDate)
    }

    if (isEditing.value && props.editingTransaction) {
      await editTransaction(props.editingTransaction.id, transactionData as UpdateTransactionRequest)
      modalSuccess.value = 'Transacción actualizada exitosamente'
      emit('transactionUpdated')
    } else {
      await addTransaction(transactionData as CreateTransactionRequest)
      modalSuccess.value = 'Transacción creada exitosamente'
      emit('transactionCreated')
    }
    resetForm()
    closeModal()

  } catch (error: any) {
    console.error('Error saving transaction:', error)
    modalError.value = error.message || `Error al ${isEditing.value ? 'actualizar' : 'crear'} la transacción`
  }
}

function closeModal() {
  try {
    const modalElement = document.getElementById(props.modalId)
    if (modalElement) {
      const modal = Modal.getInstance(modalElement) || new Modal(modalElement)
      modal.hide()
    }
  } catch (error) {
    console.warn('Error closing modal:', error)
    // Fallback: trigger close button click
    const modalElement = document.getElementById(props.modalId)
    if (modalElement) {
      const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]') as HTMLElement
      if (closeButton) {
        closeButton.click()
      }
    }
  }
}

// Watch for transaction type changes to reset category
watch(() => form.value.type, (newType, oldType) => {
  if (newType !== oldType && oldType) {
    // Reset category when type changes
    form.value.categoryId = ''
    // Clear any success/error messages
    modalError.value = null
    modalSuccess.value = null
  }
})

// Watch for editing transaction changes
watch(() => props.editingTransaction, (newTransaction) => {
  if (newTransaction) {
    // Load transaction data for editing
    form.value = {
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      categoryId: newTransaction.categoryId,
      transactionDate: formatDateForInput(new Date(newTransaction.transactionDate))
    }
    modalError.value = null
    modalSuccess.value = null
  } else {
    // Reset form when not editing
    resetForm()
  }
}, { immediate: true })

// Watch for modal opening to reset form
watch(() => props.modalId, () => {
  // Reset form when modal ID changes (unlikely but good practice)
  if (!props.editingTransaction) {
    resetForm()
  }
})

// Lifecycle
onMounted(() => {
  fetchCategories()

  // Listen for modal events to reset form
  const modalElement = document.getElementById(props.modalId)
  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', () => {
      if (!props.editingTransaction) {
        resetForm()
      }
    })
  }
})
</script>