<template>
  <div :class="containerClasses">
    <span v-if="props.showLabel" :class="labelClasses">{{ props.label }}</span>
    <div :class="amountClasses">
      <span v-if="props.showCurrency" class="currency">{{ props.currency }}</span>
      <span class="amount">{{ formattedAmount }}</span>
      <span v-if="props.showPercentage && props.percentage !== undefined" :class="percentageClasses">
        ({{ props.percentage >= 0 ? '+' : '' }}{{ props.percentage.toFixed(1) }}%)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Props {
  amount: number
  type?: 'income' | 'expense' | 'neutral' | 'positive' | 'negative'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  currency?: string
  showCurrency?: boolean
  decimals?: number
  label?: string
  showLabel?: boolean
  percentage?: number
  showPercentage?: boolean
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  amount: 0,
  type: 'neutral',
  size: 'md',
  currency: '$',
  showCurrency: true,
  decimals: 0,
  label: '',
  showLabel: false,
  showPercentage: false,
  align: 'left'
})

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  }).format(Math.abs(amount))
}

const formattedAmount = computed(() => {
  return formatAmount(props.amount)
})

const containerClasses = computed(() => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  return [
    'inline-flex flex-col',
    alignClasses[props.align]
  ].join(' ')
})

const labelClasses = computed(() => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm',
    xl: 'text-base',
    '2xl': 'text-lg'
  }
  
  return [
    'text-gray-600 font-medium mb-1',
    sizeClasses[props.size]
  ].join(' ')
})

const amountClasses = computed(() => {
  const baseClasses = 'font-mono font-semibold inline-flex items-baseline'
  
  const sizeClasses = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  }
  
  const typeClasses = {
    income: 'text-green-600',
    expense: 'text-red-600', 
    neutral: 'text-gray-900',
    positive: 'text-green-600',
    negative: 'text-red-600'
  }
  
  // Auto-detect type based on amount if not specified
  let actualType = props.type
  if (props.type === 'neutral' && props.amount !== 0) {
    actualType = props.amount > 0 ? 'positive' : 'negative'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size],
    typeClasses[actualType]
  ].join(' ')
})

const percentageClasses = computed(() => {
  const baseClasses = 'ml-2 text-sm font-medium'
  
  if (props.percentage === undefined) return baseClasses
  
  const colorClass = props.percentage >= 0 ? 'text-green-600' : 'text-red-600'
  
  return [baseClasses, colorClass].join(' ')
})
</script>

<style scoped>
.currency {
  @apply mr-1 opacity-80;
}

.amount {
  @apply tabular-nums;
}
</style> 