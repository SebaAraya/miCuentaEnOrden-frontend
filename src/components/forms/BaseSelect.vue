<template>
  <div class="form-group">
    <label 
      v-if="label" 
      :for="selectId" 
      class="form-label"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <select
      :id="selectId"
      :disabled="disabled"
      :required="required"
      :value="modelValue"
      :class="selectClasses"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option 
        v-for="option in options" 
        :key="getOptionValue(option)"
        :value="getOptionValue(option)"
      >
        {{ getOptionLabel(option) }}
      </option>
    </select>
    
    <div v-if="error || hint" class="mt-1">
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="hint" class="text-sm text-gray-500">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Option = string | { label: string; value: string | number }

export interface Props {
  modelValue?: string | number
  options: Option[]
  label?: string
  placeholder?: string
  hint?: string 
  error?: string
  disabled?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'bordered'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  label: '',
  placeholder: '',
  hint: '',
  error: '',
  disabled: false,
  required: false,
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [event: Event]
}>()

const selectId = ref(`select-${Math.random().toString(36).substr(2, 9)}`)

const getOptionValue = (option: Option): string | number => {
  return typeof option === 'string' ? option : option.value
}

const getOptionLabel = (option: Option): string => {
  return typeof option === 'string' ? option : option.label
}

const baseClasses = 'w-full transition-colors duration-200 focus:outline-none bg-white'

const variantClasses = computed(() => {
  const variants = {
    default: 'border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500',
    bordered: 'border-2 border-gray-200 focus:border-primary-500'
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

const selectClasses = computed(() => {
  return [
    baseClasses,
    variantClasses.value,
    sizeClasses.value,
    stateClasses.value
  ].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  let value: string | number = target.value
  
  // Try to parse as number if it looks like a number
  if (!isNaN(Number(value)) && value !== '') {
    value = Number(value)
  }
  
  emit('update:modelValue', value)
  emit('change', event)
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