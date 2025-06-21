<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header v-if="props.showHeader" class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <slot name="header-left">
              <div class="flex items-center">
                <h1 class="text-xl font-semibold text-gray-900">{{ props.title }}</h1>
              </div>
            </slot>
          </div>
          
          <div class="flex items-center space-x-4">
            <slot name="header-right" />
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside v-if="props.showSidebar" :class="sidebarClasses">
        <div class="h-full px-3 py-4 overflow-y-auto">
          <slot name="sidebar" />
        </div>
      </aside>

      <!-- Main Content -->
      <main :class="mainClasses">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Props {
  title?: string
  showHeader?: boolean
  showSidebar?: boolean
  sidebarWidth?: 'sm' | 'md' | 'lg'
  sidebarCollapsible?: boolean
  fluid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'MiCuentaEnOrden',
  showHeader: true,
  showSidebar: false,
  sidebarWidth: 'md',
  sidebarCollapsible: false,
  fluid: false
})

const sidebarClasses = computed(() => {
  const baseClasses = 'bg-white border-r border-gray-200 transition-all duration-200'
  
  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80'
  }
  
  return [
    baseClasses,
    widthClasses[props.sidebarWidth]
  ].join(' ')
})

const mainClasses = computed(() => {
  const baseClasses = 'flex-1 overflow-auto'
  
  return [
    baseClasses,
    props.fluid ? 'w-full' : ''
  ].join(' ')
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style> 