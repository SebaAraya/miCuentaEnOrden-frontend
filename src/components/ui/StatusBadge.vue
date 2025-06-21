<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Props {
  variant?: 'income' | 'expense' | 'budget-ok' | 'budget-warning' | 'budget-exceeded' | 'primary' | 'secondary' | 'warning' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md'
})

const baseClasses = 'inline-flex items-center font-medium rounded-md transition-colors'

const variantClasses = computed(() => {
  const variants = {
    income: 'text-green-700 bg-green-50 border border-green-200',
    expense: 'text-red-700 bg-red-50 border border-red-200',
    'budget-ok': 'text-green-700 bg-green-50 border border-green-200',
    'budget-warning': 'text-yellow-700 bg-yellow-50 border border-yellow-200',
    'budget-exceeded': 'text-red-700 bg-red-50 border border-red-200',
    primary: 'text-blue-700 bg-blue-50 border border-blue-200',
    secondary: 'text-gray-700 bg-gray-50 border border-gray-200',
    warning: 'text-yellow-700 bg-yellow-50 border border-yellow-200',
    danger: 'text-red-700 bg-red-50 border border-red-200',
    success: 'text-green-700 bg-green-50 border border-green-200'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  return sizes[props.size]
})

const badgeClasses = computed(() => {
  return [
    baseClasses,
    variantClasses.value,
    sizeClasses.value
  ].join(' ')
})
</script> 