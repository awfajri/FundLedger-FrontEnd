import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import CashOutView from '../views/CashOutView.vue'
import CashInView from '../views/CashInView.vue'
import ApprovalView from '../views/ApprovalView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'

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

// Navigation Guard (Satpam Rute)
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const isAuth = auth.isAuthenticated()

  if (to.meta.requiresAuth && !isAuth) {
    next('/login') // Belum login? Tendang ke halaman login
  } else if (to.name === 'login' && isAuth) {
    next('/') // Udah login kok buka /login lagi? Balikin ke dashboard
  } else {
    next() // Aman, biarkan lewat
  }
})

export default router
