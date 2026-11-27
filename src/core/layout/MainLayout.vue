<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../modules/auth/stores/auth'
import { web3Service, type WalletState } from '../contracts/web3Service'

const auth = useAuthStore()
const route = useRoute()

const walletState = ref<WalletState>({
  isConnected: false,
  address: null,
  networkName: null,
  balanceEth: null,
})

const checkWallet = async () => {
  const current = await web3Service.getCurrentWallet()
  if (current) {
    walletState.value = current
  }
}

const connectMetaMask = async () => {
  try {
    const res = await web3Service.connectWallet()
    walletState.value = res
  } catch (err: any) {
    console.warn('Connect wallet error:', err.message)
  }
}

onMounted(() => {
  checkWallet()
})

const isRouteActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Desktop & Tablet Sidebar (Hidden on Mobile) -->
    <aside class="w-64 bg-surface border-r border-slate-200 hidden md:flex flex-col z-20">
      <!-- Brand Logo -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div>
            <h2 class="text-xl font-bold text-primary tracking-tight leading-none">FundLedger</h2>
            <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider"
              >Blockchain Ledger</span
            >
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <!-- Dashboard (Semua Role) -->
        <RouterLink
          to="/"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-home text-base"></i>
          <span>Dashboard</span>
        </RouterLink>

        <!-- KELOMPOK: TRANSAKSI (Khusus Maker / Bendahara) -->
        <div v-if="auth.isMaker()" class="pt-4 pb-1">
          <p class="px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Bendahara
          </p>
        </div>

        <RouterLink
          v-if="auth.isMaker()"
          to="/cash-in"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/cash-in')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-wallet text-base text-emerald-600"></i>
          <span>Catat Kas Masuk</span>
        </RouterLink>

        <RouterLink
          v-if="auth.isMaker()"
          to="/cash-out"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/cash-out')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-send text-base text-slate-700"></i>
          <span>Ajukan Kas Keluar</span>
        </RouterLink>

        <!-- KELOMPOK: PERSETUJUAN (Khusus Checker / Ketua) -->
        <div v-if="auth.isChecker()" class="pt-4 pb-1">
          <p class="px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Ketua
          </p>
        </div>

        <RouterLink
          v-if="auth.isChecker()"
          to="/approvals"
          :class="[
            'flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/approvals')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-check-square text-base text-amber-600"></i>
            <span>Persetujuan Kas</span>
          </div>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800"
          >
            Pending
          </span>
        </RouterLink>

        <!-- KELOMPOK: TRANSPARANSI & AUDIT (Semua Role) -->
        <div class="pt-4 pb-1">
          <p class="px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Transparansi & Audit
          </p>
        </div>

        <RouterLink
          to="/ledger"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/ledger')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-database text-base text-purple-600"></i>
          <span>Buku Besar Kas</span>
        </RouterLink>

        <RouterLink
          to="/audit"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/audit')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-shield text-base text-indigo-600"></i>
          <span>Audit & Verifikasi</span>
        </RouterLink>

        <RouterLink
          to="/reports"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/reports')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-file text-base text-slate-600"></i>
          <span>Laporan Keuangan</span>
        </RouterLink>

        <RouterLink
          to="/organization"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors',
            isRouteActive('/organization')
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60',
          ]"
        >
          <i class="pi pi-users text-base text-slate-600"></i>
          <span>Profil Organisasi</span>
        </RouterLink>
      </nav>

      <!-- Tombol Logout -->
      <div class="p-4 border-t border-slate-100">
        <button
          @click="auth.logout()"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
        >
          <i class="pi pi-sign-out text-base"></i>
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header
        class="h-16 bg-surface border-b border-slate-200 flex items-center px-4 sm:px-8 justify-between z-10"
      >
        <!-- Organization Info / Mobile Logo -->
        <div class="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Logo HIMASASIN"
            class="md:hidden w-8 h-8 rounded-lg object-contain bg-slate-100"
          />
          <div>
            <h1
              class="font-semibold text-sm sm:text-base text-slate-900 truncate max-w-[200px] sm:max-w-md"
            >
              {{ auth.user?.organization?.name || 'HIMASASIN' }}
            </h1>
            <span class="text-[11px] text-slate-500 hidden sm:block"
              >Smart Contract EVM Sepolia</span
            >
          </div>
        </div>

        <!-- Web3 MetaMask Status / Connect -->
        <div class="flex items-center gap-2">
          <div
            v-if="walletState.isConnected"
            class="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono"
            title="Dompet Web3 MetaMask Terhubung"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{{ walletState.address?.substring(0, 6) }}...{{ walletState.address?.substring(walletState.address.length - 4) }}</span>
            <span class="text-[10px] text-emerald-600 font-sans font-medium">({{ walletState.balanceEth }} ETH)</span>
          </div>
          <button
            v-else
            @click="connectMetaMask"
            class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-primary border border-purple-200 hover:bg-purple-100 transition-colors shadow-sm"
            title="Hubungkan dompet MetaMask browser Anda"
          >
            <i class="pi pi-wallet text-sm"></i>
            <span>Connect MetaMask</span>
          </button>
        </div>

        <!-- User Profile -->
        <div class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-semibold text-slate-900 leading-tight">
              {{ auth.user?.name || 'Pengguna' }}
            </p>
            <span
              :class="[
                'inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full mt-0.5',
                auth.isChecker()
                  ? 'bg-amber-100 text-amber-800'
                  : auth.isMaker()
                    ? 'bg-purple-100 text-primary'
                    : 'bg-slate-100 text-slate-700',
              ]"
            >
              {{ auth.userRoleLabel }}
            </span>
          </div>

          <div
            class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm"
          >
            {{ auth.user?.name?.charAt(0) || 'U' }}
          </div>

          <!-- Mobile Logout Button -->
          <button
            @click="auth.logout()"
            class="md:hidden text-slate-400 hover:text-red-600 p-1.5"
            title="Keluar"
          >
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </header>

      <!-- Scrollable Page Content (Extra bottom padding on mobile for Bottom Tab Nav) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Tab Navigation -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-slate-200 z-30 px-2 py-1.5 flex justify-around items-center"
    >
      <!-- Home -->
      <RouterLink
        to="/"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors',
          isRouteActive('/') ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <i class="pi pi-home text-lg"></i>
        <span class="text-[10px] mt-0.5">Ringkasan</span>
      </RouterLink>

      <!-- Transaksi / Persetujuan (Sesuai Role) -->
      <RouterLink
        v-if="auth.isMaker()"
        to="/cash-in"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors',
          isRouteActive('/cash-in') || isRouteActive('/cash-out')
            ? 'text-primary font-bold'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <i class="pi pi-wallet text-lg"></i>
        <span class="text-[10px] mt-0.5">Pencatatan</span>
      </RouterLink>

      <RouterLink
        v-else-if="auth.isChecker()"
        to="/approvals"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors relative',
          isRouteActive('/approvals')
            ? 'text-primary font-bold'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <i class="pi pi-check-square text-lg"></i>
        <span class="text-[10px] mt-0.5">Persetujuan</span>
        <span class="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
      </RouterLink>

      <!-- Ledger -->
      <RouterLink
        to="/ledger"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors',
          isRouteActive('/ledger')
            ? 'text-primary font-bold'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <i class="pi pi-database text-lg"></i>
        <span class="text-[10px] mt-0.5">Buku Besar</span>
      </RouterLink>

      <!-- Laporan -->
      <RouterLink
        to="/reports"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors',
          isRouteActive('/reports')
            ? 'text-primary font-bold'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <i class="pi pi-file text-lg"></i>
        <span class="text-[10px] mt-0.5">Laporan</span>
      </RouterLink>

      <!-- Organisasi -->
      <RouterLink
        to="/organization"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors',
          isRouteActive('/organization')
            ? 'text-primary font-bold'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <i class="pi pi-users text-lg"></i>
        <span class="text-[10px] mt-0.5">Organisasi</span>
      </RouterLink>
    </nav>
  </div>
</template>
