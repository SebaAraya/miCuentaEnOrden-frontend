<template>
  <div class="app-layout">
    <!-- Navegación superior -->
    <AppNavbar />

    <!-- Contenido principal -->
    <main class="main-content">
      <div class="container-fluid px-3 px-lg-4 py-4">
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
  background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
}

.main-content {
  flex: 1;
  background: transparent;
  position: relative;
}

/* Asegurar que el contenido se extienda completamente */
.container-fluid {
  min-height: calc(100vh - 76px);
  /* Altura menos el navbar */
  width: 100%;
  max-width: none;
  /* Anular cualquier max-width heredado */
}

/* Mejoras para accesibilidad */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>