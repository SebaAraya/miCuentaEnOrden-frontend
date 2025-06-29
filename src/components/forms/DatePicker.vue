<template>
  <div class="date-picker-container">
    <label v-if="label" class="form-label" :for="inputId">
      <i v-if="icon" :class="icon" class="me-2"></i>
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="input-group date-picker-group" :class="inputGroupClasses">
      <span class="input-group-text">
        <i class="bi bi-calendar3"></i>
      </span>
      <input :id="inputId" :value="modelValue" @input="handleInput" @change="handleChange" @blur="handleBlur"
        type="date" class="form-control" :class="inputClasses" :placeholder="placeholder" :min="min" :max="max"
        :disabled="disabled" :required="required" ref="dateInput" />
      <button v-if="clearable && modelValue" @click="clearDate" type="button"
        class="btn btn-outline-secondary clear-btn" :disabled="disabled" title="Limpiar fecha">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <div v-if="hasError" class="invalid-feedback d-block">
      {{ errorMessage }}
    </div>

    <div v-if="helpText && !hasError" class="form-text text-muted">
      <i class="bi bi-info-circle me-1"></i>
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  icon?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  clearable?: boolean
  min?: string
  max?: string
  errorMessage?: string
  helpText?: string
  size?: 'sm' | 'lg'
  variant?: 'default' | 'primary' | 'success' | 'danger'
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Seleccionar fecha',
  clearable: true,
  size: undefined,
  variant: 'default'
})

const emit = defineEmits<Emits>()

const dateInput = ref<HTMLInputElement>()

// Computed
const inputId = computed(() => `date-picker-${Math.random().toString(36).substr(2, 9)}`)

const hasError = computed(() => !!props.errorMessage)

const inputClasses = computed(() => {
  const classes = []

  if (hasError.value) {
    classes.push('is-invalid')
  }

  if (props.size) {
    classes.push(`form-control-${props.size}`)
  }

  switch (props.variant) {
    case 'primary':
      classes.push('border-primary')
      break
    case 'success':
      classes.push('border-success')
      break
    case 'danger':
      classes.push('border-danger')
      break
  }

  return classes
})

const inputGroupClasses = computed(() => {
  const classes = []

  if (props.size) {
    classes.push(`input-group-${props.size}`)
  }

  if (hasError.value) {
    classes.push('is-invalid')
  }

  return classes
})

// Methods
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('change', target.value)
}

function handleBlur(event: FocusEvent) {
  emit('blur', event)
}

function clearDate() {
  emit('update:modelValue', '')
  emit('clear')
  dateInput.value?.focus()
}

// Expose methods for parent component
defineExpose({
  focus: () => dateInput.value?.focus(),
  blur: () => dateInput.value?.blur()
})
</script>

<style scoped>
.date-picker-container {
  width: 100%;
}

/* Input Group con bordes unidos */
.date-picker-group {
  border-radius: 0.5rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  /*  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); */
  border: 1px solid #dee2e6;
  background: white;
}

.date-picker-group .input-group-text {
  background: #f8fafc;
  border: none;
  border-right: 1px solid #dee2e6;
  color: #22c55e;
  font-size: 1rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
  border-radius: 0.5rem 0 0 0.5rem;
}

.date-picker-group .form-control {
  border: none;
  background: transparent;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  border-radius: 0;
}

.date-picker-group .clear-btn {
  border: none;
  border-left: 1px solid #dee2e6;
  background: #f8fafc;
  color: #64748b;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
  border-radius: 0 0.5rem 0.5rem 0;
}

/* Cuando no hay botón clear, el input debe tener border radius a la derecha */
.date-picker-group .form-control:last-child {
  border-radius: 0 0.5rem 0.5rem 0;
}

/* Focus State */
.date-picker-group:focus-within {
  /* box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); */
  border-color: #22c55e;
  transform: translateY(-1px);
}

.date-picker-group:focus-within .input-group-text {
  background: rgba(34, 197, 94, 0.05);
  color: #16a34a;
  border-right-color: #22c55e;
}

.date-picker-group:focus-within .form-control {
  outline: none;
  box-shadow: none;
}

.date-picker-group:focus-within .clear-btn {
  background: rgba(34, 197, 94, 0.05);
  border-left-color: #22c55e;
}

/* Hover State */
/* .date-picker-group:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e1;
} */

.clear-btn:hover {
  background: #ef4444 !important;
  color: white !important;
}

/* Error State */
.date-picker-group.is-invalid {
  border-color: #ef4444;
}

.date-picker-group.is-invalid .input-group-text {
  background: rgba(239, 68, 68, 0.05);
  color: #ef4444;
  border-right-color: #ef4444;
}

.date-picker-group.is-invalid .clear-btn {
  border-left-color: #ef4444;
}

/* Size Variants */
.input-group-sm .date-picker-group {
  border-radius: 0.375rem;
}

.input-group-sm .input-group-text {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 0.375rem 0 0 0.375rem;
}

.input-group-sm .form-control {
  font-size: 0.8125rem;
}

.input-group-sm .form-control:last-child {
  border-radius: 0 0.375rem 0.375rem 0;
}

.input-group-sm .clear-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 0 0.375rem 0.375rem 0;
}

.input-group-lg .date-picker-group {
  border-radius: 0.75rem;
}

.input-group-lg .input-group-text {
  padding: 1rem 1.25rem;
  font-size: 1rem;
  border-radius: 0.75rem 0 0 0.75rem;
}

.input-group-lg .form-control {
  font-size: 1rem;
}

.input-group-lg .form-control:last-child {
  border-radius: 0 0.75rem 0.75rem 0;
}

.input-group-lg .clear-btn {
  padding: 1rem 1.25rem;
  font-size: 1rem;
  border-radius: 0 0.75rem 0.75rem 0;
}

/* Mejoras visuales para el input date */
.form-control[type="date"]::-webkit-calendar-picker-indicator {
  background: transparent;
  bottom: 0;
  color: transparent;
  cursor: pointer;
  height: auto;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: auto;
}

.form-control[type="date"]::-webkit-datetime-edit {
  color: #1f2937;
  padding: 0;
}

.form-control[type="date"]::-webkit-datetime-edit-text {
  color: #9ca3af;
  padding: 0 2px;
}

.form-control[type="date"]::-webkit-datetime-edit-month-field,
.form-control[type="date"]::-webkit-datetime-edit-day-field,
.form-control[type="date"]::-webkit-datetime-edit-year-field {
  color: #1f2937;
  font-weight: 500;
}

.form-control[type="date"]:disabled {
  background-color: #f1f5f9;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 767.98px) {
  .date-picker-group {
    border-radius: 0.375rem;
  }

  .date-picker-group .input-group-text {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 0.375rem 0 0 0.375rem;
  }

  .date-picker-group .form-control {
    font-size: 0.8125rem;
  }

  .date-picker-group .form-control:last-child {
    border-radius: 0 0.375rem 0.375rem 0;
  }

  .date-picker-group .clear-btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 0 0.375rem 0.375rem 0;
  }
}

/* Accesibilidad */
@media (prefers-reduced-motion: reduce) {

  .date-picker-group,
  .input-group-text,
  .form-control,
  .clear-btn {
    transition: none !important;
  }
}
</style>