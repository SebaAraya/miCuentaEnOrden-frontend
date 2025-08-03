<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <!-- Error Alert -->
            <div v-if="error" class="alert alert-danger" role="alert">
              {{ error }}
            </div>

            <!-- Vista previa -->
            <div class="mb-4">
              <label class="form-label">Vista previa</label>
              <div class="d-flex align-items-center p-3 border rounded bg-light">
                <div 
                  class="rounded-circle me-3 d-flex align-items-center justify-content-center"
                  :style="{ backgroundColor: form.colorHex, width: '50px', height: '50px' }"
                >
                  <span class="text-white fw-bold fs-4">{{ form.icon || '💰' }}</span>
                </div>
                <div>
                  <div class="fw-semibold">{{ form.name || 'Nombre de la categoría' }}</div>
                  <small class="text-muted">{{ form.description || 'Descripción de la categoría' }}</small>
                  <div class="mt-1">
                    <span 
                      :class="form.isIncomeCategory ? 'badge bg-success' : 'badge bg-danger'"
                    >
                      <i :class="form.isIncomeCategory ? 'bi bi-arrow-up-circle' : 'bi bi-arrow-down-circle'" class="me-1"></i>
                      {{ form.isIncomeCategory ? 'Ingreso' : 'Gasto' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="row g-3">
              <!-- Nombre -->
              <div class="col-12">
                <label for="categoryName" class="form-label">
                  Nombre <span class="text-danger">*</span>
                </label>
                <input
                  id="categoryName"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': validationErrors.name }"
                  placeholder="Ej: Alimentación, Salario, etc."
                  v-model="form.name"
                  maxlength="50"
                  required
                >
                <div v-if="validationErrors.name" class="invalid-feedback">
                  {{ validationErrors.name }}
                </div>
              </div>

              <!-- Descripción -->
              <div class="col-12">
                <label for="categoryDescription" class="form-label">Descripción</label>
                <textarea
                  id="categoryDescription"
                  class="form-control"
                  :class="{ 'is-invalid': validationErrors.description }"
                  placeholder="Descripción opcional de la categoría"
                  v-model="form.description"
                  rows="2"
                  maxlength="255"
                ></textarea>
                <div v-if="validationErrors.description" class="invalid-feedback">
                  {{ validationErrors.description }}
                </div>
                <div class="form-text">{{ form.description?.length || 0 }}/255 caracteres</div>
              </div>

              <!-- Tipo de categoría -->
              <div class="col-12">
                <label class="form-label">
                  Tipo de categoría <span class="text-danger">*</span>
                </label>
                <div class="row g-2">
                  <div class="col-6">
                    <div class="form-check border rounded p-3 h-100">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="categoryType"
                        id="expenseType"
                        :value="false"
                        v-model="form.isIncomeCategory"
                      >
                      <label class="form-check-label w-100" for="expenseType">
                        <div class="d-flex align-items-center">
                          <i class="bi bi-arrow-down-circle text-danger fs-4 me-2"></i>
                          <div>
                            <div class="fw-semibold">Gasto</div>
                            <small class="text-muted">Dinero que sale</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check border rounded p-3 h-100">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="categoryType"
                        id="incomeType"
                        :value="true"
                        v-model="form.isIncomeCategory"
                      >
                      <label class="form-check-label w-100" for="incomeType">
                        <div class="d-flex align-items-center">
                          <i class="bi bi-arrow-up-circle text-success fs-4 me-2"></i>
                          <div>
                            <div class="fw-semibold">Ingreso</div>
                            <small class="text-muted">Dinero que entra</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Color e Icono -->
              <div class="col-md-6">
                <label for="categoryColor" class="form-label">Color</label>
                <div class="input-group">
                  <input
                    id="categoryColor"
                    type="color"
                    class="form-control form-control-color"
                    v-model="form.colorHex"
                    title="Seleccionar color"
                  >
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.colorHex }"
                    placeholder="#6B7280"
                    v-model="form.colorHex"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  >
                </div>
                <div v-if="validationErrors.colorHex" class="invalid-feedback">
                  {{ validationErrors.colorHex }}
                </div>
              </div>

              <div class="col-md-6">
                <label for="categoryIcon" class="form-label">Icono (Emoji)</label>
                <input
                  id="categoryIcon"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': validationErrors.icon }"
                  placeholder="💰"
                  v-model="form.icon"
                  maxlength="2"
                >
                <div v-if="validationErrors.icon" class="invalid-feedback">
                  {{ validationErrors.icon }}
                </div>
                <div class="form-text">Usa un emoji que represente la categoría</div>
              </div>

              <!-- Iconos sugeridos -->
              <div class="col-12">
                <label class="form-label">Iconos sugeridos</label>
                <div class="d-flex flex-wrap gap-2">
                  <button
                    v-for="icon in suggestedIcons"
                    :key="icon"
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    :class="{ 'active': form.icon === icon }"
                    @click="form.icon = icon"
                  >
                    {{ icon }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isEditing ? 'Actualizar' : 'Crear' }} Categoría
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useCategories } from '@/composables/useCategories'
import type { Category, CategoryFormData } from '@/types/financial'

// Props
interface Props {
  show: boolean
  category?: Category | null
}

const props = withDefaults(defineProps<Props>(), {
  category: null
})

// Emits
const emit = defineEmits<{
  close: []
  saved: [category: Category]
}>()

// Composables
const { addCategory, editCategory, loading, error, clearError } = useCategories()

// Estado local
const form = reactive<CategoryFormData>({
  name: '',
  description: '',
  colorHex: '#6B7280',
  icon: '💰',
  isIncomeCategory: false
})

const validationErrors = ref<Record<string, string>>({})

// Computed
const isEditing = computed(() => !!props.category)

const isFormValid = computed(() => {
  return form.name.trim().length >= 2 && 
         form.colorHex.match(/^#[0-9A-Fa-f]{6}$/) &&
         Object.keys(validationErrors.value).length === 0
})

const suggestedIcons = computed(() => {
  if (form.isIncomeCategory) {
    return ['💰', '💵', '💸', '🏦', '💳', '📈', '💎', '🎯', '⚡', '🔥']
  } else {
    return ['🍕', '🚗', '🏠', '🏥', '🎬', '📚', '👕', '💊', '⚡', '📱', '🐕', '📦']
  }
})

// Métodos
function validateForm() {
  const errors: Record<string, string> = {}

  // Validar nombre
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido'
  } else if (form.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
  } else if (form.name.trim().length > 50) {
    errors.name = 'El nombre no puede exceder 50 caracteres'
  }

  // Validar descripción
  if (form.description && form.description.length > 255) {
    errors.description = 'La descripción no puede exceder 255 caracteres'
  }

  // Validar color
  if (!form.colorHex.match(/^#[0-9A-Fa-f]{6}$/)) {
    errors.colorHex = 'El color debe ser un código hexadecimal válido (#RRGGBB)'
  }

  // Validar icono
  if (form.icon && form.icon.length > 2) {
    errors.icon = 'El icono no puede exceder 2 caracteres'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.colorHex = '#6B7280'
  form.icon = '💰'
  form.isIncomeCategory = false
  validationErrors.value = {}
  clearError()
}

function loadCategoryData() {
  if (props.category) {
    form.name = props.category.name
    form.description = props.category.description || ''
    form.colorHex = props.category.colorHex
    form.icon = props.category.icon
    form.isIncomeCategory = props.category.isIncomeCategory
  } else {
    resetForm()
  }
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    clearError()
    
    const categoryData = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      colorHex: form.colorHex,
      icon: form.icon || '💰',
      isIncomeCategory: form.isIncomeCategory
    }

    let savedCategory: Category

    if (isEditing.value && props.category) {
      savedCategory = await editCategory(props.category.id, categoryData)
    } else {
      savedCategory = await addCategory(categoryData)
    }

    emit('saved', savedCategory)
    resetForm()
  } catch (err) {
    // Error manejado por el composable
    console.error('Error saving category:', err)
  }
}

// Watchers
watch(() => props.show, (newValue) => {
  if (newValue) {
    loadCategoryData()
  }
})

watch(() => props.category, () => {
  if (props.show) {
    loadCategoryData()
  }
})

// Validación en tiempo real
watch(() => form.name, validateForm)
watch(() => form.description, validateForm)
watch(() => form.colorHex, validateForm)
watch(() => form.icon, validateForm)
</script>

<style scoped>
.form-check-input:checked ~ .form-check-label {
  background-color: rgba(13, 110, 253, 0.1);
}

.form-control-color {
  width: 56px;
  height: 38px;
  padding: 4px;
}

.modal.show {
  display: block !important;
}

.btn.active {
  background-color: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
}

.form-check {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.form-check:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.form-check-label {
  cursor: pointer;
}
</style>