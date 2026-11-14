import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../../modules/dashboard/views/DashboardView.vue'
import CashInView from '../../modules/transactions/views/CashInView.vue'
import CashOutView from '../../modules/transactions/views/CashOutView.vue'
import ApprovalView from '../../modules/transactions/views/ApprovalView.vue'
import LedgerView from '../../modules/transactions/views/LedgerView.vue'
import AuditView from '../../modules/transactions/views/AuditView.vue'
import FinancialReportView from '../../modules/reports/views/FinancialReportView.vue'
import OrganizationView from '../../modules/organization/views/OrganizationView.vue'
import LoginView from '../../modules/auth/views/LoginView.vue'
import RegisterView from '../../modules/auth/views/RegisterView.vue'
import { useAuthStore } from '../../modules/auth/stores/auth'
import Swal from 'sweetalert2'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, allowedRoles: ['maker', 'checker', 'viewer'] },
    },
    {
      path: '/cash-in',
      name: 'cash-in',
      component: CashInView,
      meta: { requiresAuth: true, allowedRoles: ['maker'] }, // Hanya Bendahara
    },
    {
      path: '/cash-out',
      name: 'cash-out',
      component: CashOutView,
      meta: { requiresAuth: true, allowedRoles: ['maker'] }, // Hanya Bendahara
    },
    {
      path: '/approvals',
      name: 'approvals',
      component: ApprovalView,
      meta: { requiresAuth: true, allowedRoles: ['checker'] }, // Hanya Ketua
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: LedgerView,
      meta: { requiresAuth: true, allowedRoles: ['maker', 'checker', 'viewer'] },
    },
    {
      path: '/audit',
      name: 'audit',
      component: AuditView,
      meta: { requiresAuth: true, allowedRoles: ['maker', 'checker', 'viewer'] },
    },
    {
      path: '/reports',
      name: 'reports',
      component: FinancialReportView,
      meta: { requiresAuth: true, allowedRoles: ['maker', 'checker', 'viewer'] },
    },
    {
      path: '/organization',
      name: 'organization',
      component: OrganizationView,
      meta: { requiresAuth: true, allowedRoles: ['maker', 'checker', 'viewer'] },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Navigation Guard dengan Role-Based Access Control (RBAC)
router.beforeEach((to) => {
  const auth = useAuthStore()
  const isAuth = auth.isAuthenticated()
  const userRole = auth.user?.role

  // 1. Cek Login
  if (to.meta.requiresAuth && !isAuth) {
    return '/login'
  }

  // 2. Mencegah user yang sudah login balik ke halaman login atau register
  if ((to.name === 'login' || to.name === 'register') && isAuth) {
    return '/'
  }

  // 3. Cek Hak Akses Berdasarkan Peran Pengguna (RBAC)
  if (to.meta.allowedRoles) {
    const roles = to.meta.allowedRoles as string[]
    if (userRole && !roles.includes(userRole)) {
      Swal.fire({
        title: 'Akses Dibatasi',
        text: `Peran Anda (${auth.userRoleLabel}) tidak memiliki izin mengakses menu ini.`,
        icon: 'warning',
        confirmButtonColor: '#5B21B6',
      })
      return '/'
    }
  }
})

export default router
