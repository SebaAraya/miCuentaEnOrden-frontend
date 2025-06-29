<template>
  <div class="app-layout">
    <!-- Navegación superior -->
    <AppNavbar />

    <!-- Contenido principal -->
    <main class="main-content">
      <div class="container-fluid py-4">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from './AppNavbar.vue'
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background-color: #f8f9fa;
}

/* Asegurar que el contenido se extienda completamente */
.container-fluid {
  min-height: calc(100vh - 76px);
  /* Altura menos el navbar */
}

/* Mejoras para accesibilidad */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Responsive adjustments */
@media (max-width: 767.98px) {
  .container-fluid {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (min-width: 768px) and (max-width: 991.98px) {
  .container-fluid {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>