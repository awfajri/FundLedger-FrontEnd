import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import CashOutView from '../views/CashOutView.vue'
import CashInView from '../views/CashInView.vue'
import ApprovalView from '../views/ApprovalView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/cash-in',
      name: 'cash-in',
      component: CashInView,
    },
    {
      path: '/cash-out',
      name: 'cash-out',
      component: CashOutView,
    },
    {
      path: '/approval',
      name: 'approval',
      component: ApprovalView,
    },
  ],
})

export default router
