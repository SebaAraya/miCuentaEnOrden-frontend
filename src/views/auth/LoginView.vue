<template>
  <div class="auth-container">
    <div class="container-fluid min-vh-100">
      <div class="row min-vh-100 g-0">
        <!-- Lado izquierdo - Información del producto -->
        <div class="col-lg-7 d-none d-lg-flex auth-info-side">
          <div class="d-flex flex-column justify-content-center p-5 w-100">
            <!-- Header del producto -->
            <div class="text-center mb-5">
              <div class="logo-container mb-4">
                <i class="bi bi-wallet2 text-white" style="font-size: 5rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));"></i>
              </div>
              <h1 class="display-4 text-white fw-bold mb-3">MiCuentaEnOrden</h1>
              <p class="lead text-white fs-4 mb-4">Tu plataforma integral de gestión financiera</p>
              <div class="subtitle-badge">
                <span class="badge bg-success fs-6 px-3 py-2">¡Totalmente gratuito!</span>
              </div>
            </div>
            
            <!-- Descripción del producto -->
            <div class="product-description mb-5">
              <h3 class="h4 text-white mb-4 text-center">¿Por qué elegir MiCuentaEnOrden?</h3>
              <div class="description-text mb-4">
                <p class="text-white-75 fs-5 text-center mb-4">
                  Simplifica tu vida financiera con nuestra plataforma todo-en-uno. 
                  Diseñada para personas y equipos que buscan control total sobre sus finanzas.
                </p>
              </div>
            </div>
            
            <!-- Características principales -->
            <div class="features-grid">
              <div class="row g-3">
                <div class="col-12">
                  <div class="feature-card">
                    <div class="feature-icon">
                      <i class="bi bi-graph-up-arrow text-warning"></i>
                    </div>
                    <div class="feature-content">
                      <h5 class="text-white mb-2">Gestión Inteligente</h5>
                      <p class="text-white-75 mb-0">Rastrea ingresos y gastos con categorización automática</p>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="feature-card">
                    <div class="feature-icon">
                      <i class="bi bi-bullseye text-info"></i>
                    </div>
                    <div class="feature-content">
                      <h5 class="text-white mb-2">Presupuestos Dinámicos</h5>
                      <p class="text-white-75 mb-0">Establece metas y recibe alertas en tiempo real</p>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="feature-card">
                    <div class="feature-icon">
                      <i class="bi bi-bar-chart text-success"></i>
                    </div>
                    <div class="feature-content">
                      <h5 class="text-white mb-2">Reportes Avanzados</h5>
                      <p class="text-white-75 mb-0">Visualiza tendencias y toma decisiones informadas</p>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="feature-card">
                    <div class="feature-icon">
                      <i class="bi bi-people text-primary"></i>
                    </div>
                    <div class="feature-content">
                      <h5 class="text-white mb-2">Colaboración en Equipo</h5>
                      <p class="text-white-75 mb-0">Comparte presupuestos y gestiona finanzas familiares</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Testimonial o estadística -->
            <div class="testimonial-section mt-5 text-center">
              <div class="stats-container">
                <div class="row g-4">
                  <div class="col-4">
                    <div class="stat-item">
                      <h4 class="text-warning fw-bold mb-1">10K+</h4>
                      <p class="text-white-75 small mb-0">Usuarios activos</p>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="stat-item">
                      <h4 class="text-info fw-bold mb-1">99.9%</h4>
                      <p class="text-white-75 small mb-0">Uptime</p>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="stat-item">
                      <h4 class="text-success fw-bold mb-1">4.9★</h4>
                      <p class="text-white-75 small mb-0">Valoración</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lado derecho - Formulario de login -->
        <div class="col-lg-5 d-flex align-items-stretch">
          <div class="auth-form-container w-100 d-flex flex-column justify-content-center">
            <div class="form-wrapper">
              <!-- Header del formulario -->
              <div class="form-header text-center mb-4">
                <div class="d-lg-none mb-4">
                  <i class="bi bi-wallet2 text-primary" style="font-size: 3rem;"></i>
                  <h2 class="h3 text-dark mt-2 mb-0">MiCuentaEnOrden</h2>
                </div>
                <h1 class="h2 text-dark fw-bold mb-2">Iniciar Sesión</h1>
                <p class="text-secondary fs-5">Accede a tu panel de control financiero</p>
              </div>

              <!-- Alert de error con mejor contraste -->
              <div v-if="authStore.error" class="alert alert-danger border-0 shadow-sm mb-4" role="alert">
                <div class="d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill me-3 fs-5"></i>
                  <div class="flex-grow-1">
                    <strong>Error:</strong> {{ authStore.error }}
                  </div>
                  <button type="button" class="btn-close btn-close-white" @click="authStore.clearError()"></button>
                </div>
              </div>

              <!-- Formulario -->
              <form @submit.prevent="handleLogin" novalidate class="needs-validation">
                <div class="mb-4">
                  <label for="email" class="form-label text-dark fw-semibold">
                    <i class="bi bi-envelope-fill me-2 text-primary"></i>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    class="form-control form-control-lg"
                    id="email"
                    v-model="form.email"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="tu@email.com"
                    required
                    autocomplete="email"
                  >
                  <div v-if="errors.email" class="invalid-feedback fw-semibold">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    {{ errors.email }}
                  </div>
                </div>

                <div class="mb-4">
                  <label for="password" class="form-label text-dark fw-semibold">
                    <i class="bi bi-lock-fill me-2 text-primary"></i>
                    Contraseña
                  </label>
                  <div class="input-group input-group-lg">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
                      id="password"
                      v-model="form.password"
                      :class="{ 'is-invalid': errors.password }"
                      placeholder="Tu contraseña"
                      required
                      autocomplete="current-password"
                    >
                    <button
                      type="button"
                      class="btn btn-outline-secondary border-start-0"
                      @click="showPassword = !showPassword"
                      :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    >
                      <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                    </button>
                  </div>
                  <div v-if="errors.password" class="invalid-feedback fw-semibold d-block">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    {{ errors.password }}
                  </div>
                </div>

                <div class="d-grid gap-2 mb-4">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg fw-semibold py-3"
                    :disabled="authStore.isLoading"
                  >
                    <span v-if="authStore.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                    {{ authStore.isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
                  </button>
                </div>
              </form>

              <!-- Divider -->
              <div class="divider-container mb-4">
                <div class="divider-line"></div>
                <span class="divider-text text-secondary">¿Primera vez aquí?</span>
                <div class="divider-line"></div>
              </div>

              <!-- Link de registro -->
              <div class="text-center">
                <p class="mb-0 text-secondary">
                  ¿No tienes una cuenta?
                  <router-link to="/register" class="text-decoration-none fw-semibold text-primary">
                    Regístrate gratis
                  </router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)

const form = reactive<LoginRequest>({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

function validateForm(): boolean {
  // Limpiar errores
  errors.email = ''
  errors.password = ''

  let isValid = true

  // Validar email
  if (!form.email) {
    errors.email = 'El correo electrónico es requerido'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'El correo electrónico no es válido'
    isValid = false
  }

  // Validar contraseña
  if (!form.password) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
    isValid = false
  }

  return isValid
}

async function handleLogin() {
  if (!validateForm()) {
    return
  }

  try {
    await authStore.login(form)
    
    // Redirigir al dashboard o a la ruta anterior
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error) {
    console.error('Error en login:', error)
  }
}
</script>

<style scoped>
/* Variables CSS para colores consistentes */
:root {
  --primary-gradient: linear-gradient(135deg, #1e3a8a 0%, #3730a3 25%, #6366f1 50%, #8b5cf6 75%, #a855f7 100%);
  --primary-dark: #1e293b;
  --primary-light: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --white-75: rgba(255, 255, 255, 0.85);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Contenedor principal */
.auth-container {
  min-height: 100vh;
  background: var(--primary-gradient);
  position: relative;
}

/* Lado izquierdo - Información */
.auth-info-side {
  background: linear-gradient(135deg, 
    rgba(30, 41, 91, 0.95) 0%, 
    rgba(55, 48, 163, 0.95) 25%, 
    rgba(99, 102, 241, 0.95) 50%, 
    rgba(139, 92, 246, 0.95) 75%, 
    rgba(168, 85, 247, 0.95) 100%);
  position: relative;
  overflow: hidden;
}

.auth-info-side::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="white" opacity="0.1"/></pattern></defs><rect width="200" height="200" fill="url(%23dots)"/></svg>');
  opacity: 0.4;
}

.logo-container {
  position: relative;
  z-index: 2;
}

/* Texto con mejor contraste */
.text-white-75 {
  color: var(--white-75) !important;
  line-height: 1.6;
}

.subtitle-badge .badge {
  font-size: 0.875rem !important;
  letter-spacing: 0.5px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

/* Características del producto */
.product-description h3 {
  position: relative;
  z-index: 2;
}

.feature-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.feature-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.875rem;
  margin-right: 1rem;
  min-width: 60px;
  text-align: center;
}

.feature-icon i {
  font-size: 1.5rem;
}

.feature-content h5 {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

/* Estadísticas */
.stats-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item h4 {
  font-size: 1.75rem;
}

/* Lado derecho - Formulario */
.auth-form-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 2rem;
  position: relative;
}

.form-wrapper {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
}

.form-header h1 {
  color: var(--text-primary);
}

.form-header p {
  color: var(--text-secondary);
}

/* Formulario con mejor contraste */
.form-label {
  color: var(--text-primary) !important;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.form-control {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #ffffff;
  color: var(--text-primary);
}

.form-control:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.form-control::placeholder {
  color: var(--text-muted);
}

.form-control.is-invalid {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.invalid-feedback {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Botón principal */
.btn-primary {
  background: var(--primary-gradient);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  transform: none;
}

/* Botón de mostrar/ocultar contraseña */
.btn-outline-secondary {
  border-color: #e2e8f0;
  color: var(--text-secondary);
  background: #ffffff;
}

.btn-outline-secondary:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: var(--text-primary);
}

/* Alert mejorado */
.alert-danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 12px;
}

/* Divider */
.divider-container {
  display: flex;
  align-items: center;
  margin: 2rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
}

.divider-text {
  padding: 0 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Enlaces */
.text-primary {
  color: #6366f1 !important;
}

.text-primary:hover {
  color: #4f46e5 !important;
}

/* Responsivo */
@media (max-width: 991.98px) {
  .auth-container {
    background: linear-gradient(180deg, var(--primary-gradient), #ffffff 40%);
  }
  
  .auth-form-container {
    background: #ffffff;
    border-radius: 24px 24px 0 0;
    margin-top: auto;
    padding: 2rem 1.5rem;
    box-shadow: var(--shadow-xl);
  }
  
  .form-wrapper {
    max-width: 100%;
  }
  
  .form-header .d-lg-none {
    margin-bottom: 2rem;
  }
}

@media (max-width: 575.98px) {
  .auth-form-container {
    padding: 1.5rem 1rem;
  }
  
  .form-control {
    padding: 0.875rem 1rem;
    font-size: 0.95rem;
  }
  
  .btn-lg {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
  
  .feature-card {
    padding: 1rem;
  }
  
  .feature-icon {
    padding: 0.75rem;
    min-width: 50px;
  }
  
  .feature-icon i {
    font-size: 1.25rem;
  }
}

/* Mejoras de accesibilidad */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* Focus visible para navegación por teclado */
.btn:focus-visible,
.form-control:focus-visible {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
}

/* Modo oscuro del sistema */
@media (prefers-color-scheme: dark) {
  .auth-form-container {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }
  
  .form-control {
    background: #334155;
    border-color: #475569;
    color: #f1f5f9;
  }
  
  .form-control:focus {
    background: #334155;
    border-color: #6366f1;
  }
  
  .form-control::placeholder {
    color: #94a3b8;
  }
  
  .form-header h1,
  .form-label {
    color: #f1f5f9 !important;
  }
  
  .form-header p,
  .text-secondary {
    color: #cbd5e1 !important;
  }
}
</style> 