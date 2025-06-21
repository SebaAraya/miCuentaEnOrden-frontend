<template>
  <div class="form-group">
    <label 
      v-if="label" 
      :for="inputId" 
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <div v-if="hasPrefix" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <slot name="prefix" />
      </div>
      
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :value="modelValue"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <div v-if="hasSuffix" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <slot name="suffix" />
      </div>
    </div>
    
    <div v-if="error || hint" class="mt-1">
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="hint" class="text-sm text-gray-500">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'

export interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  hint?: string 
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'bordered'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  label: '',
  placeholder: '',
  hint: '',
  error: '',
  disabled: false,
  readonly: false,
  required: false,
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const slots = useSlots()
const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)

const hasPrefix = computed(() => !!slots.prefix)
const hasSuffix = computed(() => !!slots.suffix)

const baseClasses = 'w-full transition-colors duration-200 focus:outline-none'

const variantClasses = computed(() => {
  const variants = {
    default: 'border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500',
    bordered: 'border-2 border-gray-200 bg-white focus:border-primary-500'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-3 py-2 text-base rounded-lg', 
    lg: 'px-4 py-3 text-lg rounded-lg'
  }
  return sizes[props.size]
})

const stateClasses = computed(() => {
  if (props.error) {
    return 'border-red-300 focus:ring-red-500 focus:border-red-500'
  }
  if (props.disabled) {
    return 'bg-gray-50 text-gray-500 cursor-not-allowed'
  }
  return ''
})

const prefixPaddingClasses = computed(() => {
  return hasPrefix.value ? 'pl-10' : ''
})

const suffixPaddingClasses = computed(() => {
  return hasSuffix.value ? 'pr-10' : ''
})

const inputClasses = computed(() => {
  return [
    baseClasses,
    variantClasses.value,
    sizeClasses.value,
    stateClasses.value,
    prefixPaddingClasses.value,
    suffixPaddingClasses.value
  ].join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value: string | number = target.value
  
  if (props.type === 'number') {
    value = parseFloat(value) || 0
  }
  
  emit('update:modelValue', value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-group {
  @apply space-y-1;
}
</style> 