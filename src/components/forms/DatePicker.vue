<template>
  <div class="date-picker-container">
    <label v-if="label" class="form-label" :for="inputId">
      <i v-if="icon" :class="icon" class="me-2"></i>
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    
         <div class="input-group" :class="inputGroupClasses">
      <span class="input-group-text bg-light border-end-0">
        <i class="bi bi-calendar3 text-primary"></i>
      </span>
      <input
        :id="inputId"
        :value="modelValue"
        @input="handleInput"
        @change="handleChange"
        @blur="handleBlur"
        type="date"
        class="form-control border-start-0 ps-2"
        :class="inputClasses"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :disabled="disabled"
        :required="required"
        ref="dateInput"
      />
      <button
        v-if="clearable && modelValue"
        @click="clearDate"
        type="button"
        class="btn btn-outline-secondary border-start-0"
        :disabled="disabled"
        title="Limpiar fecha"
      >
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

.input-group-text {
  transition: all 0.2s ease-in-out;
}

.form-control:focus + .input-group-text,
.input-group:focus-within .input-group-text {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.input-group .form-control:focus {
  box-shadow: none;
  border-color: var(--bs-primary);
}

.input-group.is-invalid .input-group-text {
  border-color: var(--bs-danger);
}

.input-group.is-invalid .form-control {
  border-color: var(--bs-danger);
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
  color: var(--bs-body-color);
}

.form-control[type="date"]::-webkit-datetime-edit-text {
  color: var(--bs-secondary);
  padding: 0 2px;
}

.form-control[type="date"]::-webkit-datetime-edit-month-field,
.form-control[type="date"]::-webkit-datetime-edit-day-field,
.form-control[type="date"]::-webkit-datetime-edit-year-field {
  color: var(--bs-body-color);
}

.form-control[type="date"]:disabled {
  background-color: var(--bs-secondary-bg);
  opacity: 1;
}

/* Animaciones suaves */
.input-group {
  transition: all 0.15s ease-in-out;
}

.btn {
  transition: all 0.15s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

.form-control {
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
</style> 