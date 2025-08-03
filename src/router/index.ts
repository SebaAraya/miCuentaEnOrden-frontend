import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/views/TransactionsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: () => import('@/views/BudgetsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { 
        requiresAuth: true,
        requiresRole: ['ADMIN', 'COLABORADOR']
      }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue'),
      meta: { 
        requiresAuth: true,
        requiresRole: ['ADMIN', 'COLABORADOR']
      }
    },
       {
       path: '/organizations',
       name: 'organizations',
       component: () => import('@/views/OrganizationsView.vue'),
       meta: { 
         requiresAuth: true,
         requiresRole: ['ADMIN']
       }
     },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Inicializar autenticación si no está inicializada
  if (!authStore.user && authStore.accessToken) {
    try {
      await authStore.getCurrentUser()
    } catch (error) {
      console.warn('Error inicializando usuario:', error)
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiresRole = to.matched.find(record => record.meta.requiresRole)?.meta.requiresRole
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role

  if (requiresAuth && !isAuthenticated) {
    // Ruta protegida sin autenticación -> redirigir al login
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresGuest && isAuthenticated) {
    // Ruta de invitado con autenticación -> redirigir al dashboard
    next({ name: 'dashboard' })
  } else if (requiresRole && isAuthenticated) {
    // Verificar permisos de rol
    const hasRequiredRole = Array.isArray(requiresRole) 
      ? requiresRole.includes(userRole)
      : requiresRole === userRole
    
    if (!hasRequiredRole) {
      // Sin permisos -> redirigir al dashboard con mensaje
      next({ 
        name: 'dashboard', 
        query: { 
          error: 'No tienes permisos para acceder a esta página' 
        } 
      })
    } else {
      next()
    }
  } else {
    // Permitir navegación
    next()
  }
})

export default router 