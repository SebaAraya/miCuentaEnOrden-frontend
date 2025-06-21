<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h5 v-if="title" class="card-title mb-0">
          <i v-if="icon" :class="`bi bi-${icon} me-2`"></i>
          {{ title }}
        </h5>
      </slot>
    </div>

    <div class="card-body" :class="bodyClasses">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'balance' | 'transaction' | 'budget' | 'income' | 'expense' | 'success' | 'danger' | 'warning' | 'info'
  title?: string
  icon?: string
  hoverable?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: false,
  size: 'md'
})

const cardClasses = computed(() => {
  const classes = ['card']

  // Variantes financieras
  switch (props.variant) {
    case 'balance':
      classes.push('financial-balance-card')
      break
    case 'transaction':
      classes.push('financial-transaction-card')
      break
    case 'budget':
      classes.push('financial-budget-card')
      break
    case 'income':
      classes.push('bg-success', 'text-white')
      break
    case 'expense':
      classes.push('bg-danger', 'text-white')
      break
    case 'success':
      classes.push('border-success')
      break
    case 'danger':
      classes.push('border-danger')
      break
    case 'warning':
      classes.push('border-warning')
      break
    case 'info':
      classes.push('border-info')
      break
  }

  // Tamaños
  if (props.size === 'sm') {
    classes.push('card-sm')
  } else if (props.size === 'lg') {
    classes.push('card-lg')
  }

  // Hoverable
  if (props.hoverable) {
    classes.push('card-hoverable')
  }

  return classes.join(' ')
})

const bodyClasses = computed(() => {
  const classes = []

  if (props.size === 'sm') {
    classes.push('p-3')
  } else if (props.size === 'lg') {
    classes.push('p-4')
  }

  return classes.join(' ')
})
</script>

<style scoped>
/* Cards Financieras */
.financial-balance-card {
  background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%);
  border: none;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
  color: white;
}

.financial-transaction-card {
  border-left: 4px solid #10b981;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.financial-transaction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.financial-budget-card {
  border: 1px solid #f8fafc;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
}

.card-hoverable {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.card-hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-sm .card-body {
  padding: 0.75rem;
}

.card-lg .card-body {
  padding: 2rem;
}

/* Bordes de colores */
.border-success {
  border-left: 4px solid #22c55e !important;
}

.border-danger {
  border-left: 4px solid #ef4444 !important;
}

.border-warning {
  border-left: 4px solid #f59e0b !important;
}

.border-info {
  border-left: 4px solid #3b82f6 !important;
}
</style>