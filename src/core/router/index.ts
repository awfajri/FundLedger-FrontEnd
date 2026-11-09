import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../../modules/dashboard/views/DashboardView.vue'
import CashOutView from '../../modules/transactions/views/CashOutView.vue'
import CashInView from '../../modules/transactions/views/CashInView.vue'
import ApprovalView from '../../modules/transactions/views/ApprovalView.vue'
import LoginView from '../../modules/auth/views/LoginView.vue'
import { useAuthStore } from '../../modules/auth/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/cash-in', name: 'cash-in', component: CashInView, meta: { requiresAuth: true } },
    { path: '/cash-out', name: 'cash-out', component: CashOutView, meta: { requiresAuth: true } },
    {
      path: '/approvals',
      name: 'approvals',
      component: ApprovalView,
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation Guard (Gaya Vue Router v4 Modern)
router.beforeEach((to) => {
  const auth = useAuthStore()
  const isAuth = auth.isAuthenticated()

  if (to.meta.requiresAuth && !isAuth) {
    return '/login'
  } else if (to.name === 'login' && isAuth) {
    return '/'
  }
})

export default router
