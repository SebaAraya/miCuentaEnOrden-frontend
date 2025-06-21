<template>
  <div class="container my-5">
    <h1 class="text-center mb-5 animate__animated animate__fadeInDown">
      <i class="bi bi-bootstrap-fill text-primary"></i>
      Demo de Bootstrap 5
    </h1>

    <!-- Alerts con animaciones -->
    <div class="row mb-4">
      <div class="col-12">
        <h2>Alertas Animadas</h2>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <strong>¡Éxito!</strong> Bootstrap está funcionando correctamente.
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
        <div class="alert alert-info alert-dismissible fade show" role="alert">
          <strong>Información:</strong> Las animaciones CSS están activas.
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      </div>
    </div>

    <!-- Botones con efectos -->
    <div class="row mb-4">
      <div class="col-12">
        <h2>Botones Interactivos</h2>
        <button @click="toggleCard" class="btn btn-primary btn-lg me-2 mb-2">
          <i class="bi bi-eye"></i> Mostrar/Ocultar Tarjeta
        </button>
        <button @click="triggerToast" class="btn btn-success btn-lg me-2 mb-2">
          <i class="bi bi-bell"></i> Mostrar Toast
        </button>
        <button class="btn btn-warning btn-lg me-2 mb-2" data-bs-toggle="modal" data-bs-target="#exampleModal">
          <i class="bi bi-window"></i> Abrir Modal
        </button>
        <div class="btn-group me-2 mb-2" role="group">
          <input type="radio" class="btn-check" name="btnradio" id="btnradio1" checked>
          <label class="btn btn-outline-primary" for="btnradio1">Radio 1</label>
          <input type="radio" class="btn-check" name="btnradio" id="btnradio2">
          <label class="btn btn-outline-primary" for="btnradio2">Radio 2</label>
          <input type="radio" class="btn-check" name="btnradio" id="btnradio3">
          <label class="btn btn-outline-primary" for="btnradio3">Radio 3</label>
        </div>
      </div>
    </div>

    <!-- Tarjeta animada -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div v-show="showCard" class="card shadow-lg" :class="cardAnimation">
          <img src="https://via.placeholder.com/400x200/007bff/ffffff?text=Bootstrap+Demo" class="card-img-top" alt="Demo">
          <div class="card-body">
            <h5 class="card-title">Tarjeta Animada</h5>
            <p class="card-text">Esta tarjeta aparece y desaparece con animaciones suaves de Bootstrap.</p>
            <div class="progress mb-3">
              <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                   role="progressbar" 
                   :style="{width: progress + '%'}">
                {{ progress }}%
              </div>
            </div>
            <button @click="updateProgress" class="btn btn-outline-primary">
              <i class="bi bi-arrow-clockwise"></i> Actualizar Progreso
            </button>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <h3>Accordion Interactivo</h3>
        <div class="accordion" id="accordionExample">
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingOne">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                <i class="bi bi-1-circle me-2"></i>Características de Bootstrap
              </button>
            </h2>
            <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#accordionExample">
              <div class="accordion-body">
                Bootstrap incluye componentes responsivos, utilidades CSS, y JavaScript interactivo.
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingTwo">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                <i class="bi bi-2-circle me-2"></i>Animaciones CSS
              </button>
            </h2>
            <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
              <div class="accordion-body">
                Las transiciones y animaciones hacen que la interfaz sea más atractiva y fluida.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Carrusel -->
    <div class="row mb-4">
      <div class="col-12">
        <h2>Carrusel con Indicadores</h2>
        <div id="carouselExample" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-indicators">
            <button type="button" data-bs-target="#carouselExample" data-bs-slide-to="0" class="active"></button>
            <button type="button" data-bs-target="#carouselExample" data-bs-slide-to="1"></button>
            <button type="button" data-bs-target="#carouselExample" data-bs-slide-to="2"></button>
          </div>
          <div class="carousel-inner">
            <div class="carousel-item active">
              <div class="d-flex justify-content-center align-items-center bg-primary text-white" style="height: 300px;">
                <div class="text-center">
                  <h3>Slide 1</h3>
                  <p>Bootstrap está funcionando perfectamente</p>
                </div>
              </div>
            </div>
            <div class="carousel-item">
              <div class="d-flex justify-content-center align-items-center bg-success text-white" style="height: 300px;">
                <div class="text-center">
                  <h3>Slide 2</h3>
                  <p>Las animaciones son fluidas</p>
                </div>
              </div>
            </div>
            <div class="carousel-item">
              <div class="d-flex justify-content-center align-items-center bg-info text-white" style="height: 300px;">
                <div class="text-center">
                  <h3>Slide 3</h3>
                  <p>Los componentes son responsivos</p>
                </div>
              </div>
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Badges y Pills -->
    <div class="row mb-4">
      <div class="col-12">
        <h2>Badges y Pills</h2>
        <span class="badge bg-primary me-2">Primary</span>
        <span class="badge bg-secondary me-2">Secondary</span>
        <span class="badge bg-success me-2">Success</span>
        <span class="badge bg-danger me-2">Danger</span>
        <span class="badge bg-warning text-dark me-2">Warning</span>
        <span class="badge bg-info text-dark me-2">Info</span>
        <span class="badge bg-light text-dark me-2">Light</span>
        <span class="badge bg-dark me-2">Dark</span>
        
        <div class="mt-3">
          <span class="badge rounded-pill bg-primary me-2">Pills Primary</span>
          <span class="badge rounded-pill bg-success me-2">Pills Success</span>
          <span class="badge rounded-pill bg-danger me-2">Pills Danger</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="exampleModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-check-circle text-success me-2"></i>
              Modal de Bootstrap
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>¡Este modal demuestra que Bootstrap JavaScript está funcionando correctamente!</p>
            <div class="alert alert-success" role="alert">
              <i class="bi bi-check-lg me-2"></i>
              Todas las animaciones y transiciones están activas.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendido</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div ref="toastElement" class="toast" role="alert">
        <div class="toast-header">
          <i class="bi bi-bell-fill text-primary me-2"></i>
          <strong class="me-auto">Notificación</strong>
          <small>Ahora</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          ¡El sistema de notificaciones Toast está funcionando!
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'BootstrapDemo',
  setup() {
    const showCard = ref(true)
    const cardAnimation = ref('animate__animated animate__fadeIn')
    const progress = ref(75)
    const toastElement = ref(null)

    const toggleCard = () => {
      if (showCard.value) {
        cardAnimation.value = 'animate__animated animate__fadeOut'
        setTimeout(() => {
          showCard.value = false
        }, 500)
      } else {
        showCard.value = true
        cardAnimation.value = 'animate__animated animate__fadeIn'
      }
    }

    const updateProgress = () => {
      progress.value = Math.floor(Math.random() * 100) + 1
    }

    const triggerToast = () => {
      if (toastElement.value) {
        const toast = new window.bootstrap.Toast(toastElement.value)
        toast.show()
      }
    }

    onMounted(() => {
      // Inicializar tooltips si están presentes
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new window.bootstrap.Tooltip(tooltipTriggerEl)
      })
    })

    return {
      showCard,
      cardAnimation,
      progress,
      toastElement,
      toggleCard,
      updateProgress,
      triggerToast
    }
  }
}
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
}

.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.progress-bar {
  transition: width 0.6s ease;
}

.carousel-item {
  transition: transform 0.6s ease;
}

.badge {
  transition: all 0.2s ease;
}

.badge:hover {
  transform: scale(1.1);
}

/* Animaciones personalizadas con keyframes CSS */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes fadeOut {
  from { 
    opacity: 1; 
    transform: translateY(0); 
  }
  to { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
}

.animate__animated.animate__fadeIn {
  animation: fadeIn 0.5s ease;
}

.animate__animated.animate__fadeOut {
  animation: fadeOut 0.5s ease;
}

.animate__animated.animate__fadeInDown {
  animation: fadeInDown 1s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style> 