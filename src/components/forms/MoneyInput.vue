<template>
  <div class="mb-3">
    <label v-if="label" class="form-label" :for="inputId">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    
    <div class="input-group">
      <span class="input-group-text">
        <i class="bi bi-currency-dollar"></i>
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        :value="formattedValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        class="form-control money-input"
        :class="inputClasses"
        type="text"
        inputmode="decimal"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
      <span v-if="currency" class="input-group-text">{{ currency }}</span>
    </div>
    
    <div v-if="error" class="form-text text-danger">
      <i class="bi bi-exclamation-triangle me-1"></i>
      {{ error }}
    </div>
    
    <div v-else-if="help" class="form-text text-muted">
      {{ help }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

interface Props {
  modelValue?: number | null
  label?: string
  placeholder?: string
  currency?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  help?: string
  min?: number
  max?: number
  precision?: number
  locale?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '0.00',
  currency: 'USD',
  disabled: false,
  readonly: false,
  required: false,
  precision: 2,
  locale: 'es-ES'
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  focus: []
  blur: []
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)
const inputId = `money-input-${Math.random().toString(36).substr(2, 9)}`

const inputClasses = computed(() => {
  const classes = []
  
  if (props.error) {
    classes.push('is-invalid')
  }
  
  return classes.join(' ')
})

const formattedValue = computed(() => {
  if (props.modelValue == null) return ''
  
  if (isFocused.value) {
    // Mostrar valor sin formato cuando está enfocado para edición
    return props.modelValue.toString()
  }
  
  // Formatear para mostrar
  return new Intl.NumberFormat(props.locale, {
    minimumFractionDigits: props.precision,
    maximumFractionDigits: props.precision
  }).format(props.modelValue)
})

const parseValue = (value: string): number | null => {
  if (!value || value.trim() === '') return null
  
  // Remover caracteres no numéricos excepto punto y coma
  const cleanValue = value.replace(/[^\d.,-]/g, '')
  
  // Reemplazar coma por punto para parsing
  const normalizedValue = cleanValue.replace(',', '.')
  
  const parsed = parseFloat(normalizedValue)
  
  if (isNaN(parsed)) return null
  
  // Aplicar límites si están definidos
  if (props.min !== undefined && parsed < props.min) {
    return props.min
  }
  
  if (props.max !== undefined && parsed > props.max) {
    return props.max
  }
  
  // Redondear según precisión
  return Math.round(parsed * Math.pow(10, props.precision)) / Math.pow(10, props.precision)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newValue = parseValue(target.value)
  emit('update:modelValue', newValue)
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
  
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.select()
    }
  })
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const handleKeydown = (event: KeyboardEvent) => {
  // Permitir teclas de control
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End'
  ]
  
  if (allowedKeys.includes(event.key)) {
    return
  }
  
  // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (event.ctrlKey || event.metaKey) {
    return
  }
  
  // Permitir números
  if (/^\d$/.test(event.key)) {
    return
  }
  
  // Permitir punto decimal una sola vez
  if (event.key === '.' || event.key === ',') {
    const currentValue = (event.target as HTMLInputElement).value
    if (!currentValue.includes('.') && !currentValue.includes(',')) {
      return
    }
  }
  
  // Bloquear todo lo demás
  event.preventDefault()
}

// Exponer métodos públicos
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select()
})
</script>

<style scoped>
.money-input {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 1.1rem;
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.money-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25);
}

.input-group-text {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
  font-weight: 500;
}

.is-invalid {
  border-color: #ef4444;
}

.is-invalid:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25);
}
</style> 