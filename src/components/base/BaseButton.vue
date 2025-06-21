<template>
  <button :class="buttonClasses" :disabled="disabled || loading" @click="$emit('click', $event)">
    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    <i v-if="icon && !loading" :class="`bi bi-${icon} me-2`"></i>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 'income' | 'expense' | 'financial'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: string
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const classes = ['btn']

  // Variantes Bootstrap estándar
  if (props.variant.startsWith('outline-')) {
    classes.push(`btn-${props.variant}`)
  } else if (['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(props.variant)) {
    classes.push(`btn-${props.variant}`)
  }

  // Variantes financieras personalizadas
  if (props.variant === 'income') {
    classes.push('btn-success', 'btn-income')
  } else if (props.variant === 'expense') {
    classes.push('btn-danger', 'btn-expense')
  } else if (props.variant === 'financial') {
    classes.push('btn-primary', 'btn-financial')
  }

  // Tamaños
  if (props.size === 'sm') {
    classes.push('btn-sm')
  } else if (props.size === 'lg') {
    classes.push('btn-lg')
  }

  // Block
  if (props.block) {
    classes.push('w-100')
  }

  return classes.join(' ')
})
</script>

<style scoped>
/* Estilos financieros personalizados */
.btn-financial {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.btn-financial:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-income {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  color: white;
}

.btn-income:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
}

.btn-expense {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  color: white;
}

.btn-expense:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
}
</style>