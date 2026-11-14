<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Card from 'primevue/card'
import { useAuthStore } from '../../auth/stores/auth'
import { transactionService } from '../../../core/api/transactionService'
import type { DashboardMetrics, Transaction } from '../../../core/types/transaction'

const auth = useAuthStore()
const isLoading = ref(true)
const isPendingBannerOpen = ref(true)

const metrics = ref<DashboardMetrics>({
  balance: 0,
  incomeThisMonth: 0,
  expenseThisMonth: 0,
  incomeYTD: 0,
  expenseYTD: 0,
  totalTransactionsCount: 0,
  pendingCount: 0,
})

const recentTransactions = ref<Transaction[]>([])

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const fetchDashboardData = async () => {
  isLoading.value = true

  try {
    const [metricsData, txData] = await Promise.all([
      transactionService.getMetrics(),
      transactionService.getTransactions({ limit: 5 }),
    ])

    metrics.value = metricsData
    recentTransactions.value = txData
  } catch (error) {
    console.error('Error memuat data dashboard:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header Dashboard & Welcome -->
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Ringkasan Keuangan</h2>
        <button
          @click="fetchDashboardData"
          class="text-slate-400 hover:text-primary p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Segarkan data kas"
        >
          <i class="pi pi-refresh text-sm" :class="{ 'animate-spin': isLoading }"></i>
        </button>
      </div>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">
        Pantau saldo kas organisasi, status persetujuan transaksi, dan riwayat ledger secara real-time.
      </p>
    </div>

    <!-- Alert Khusus Checker jika ada pengajuan pending (Collapsible) -->
    <div
      v-if="auth.isChecker() && metrics.pendingCount > 0 && isPendingBannerOpen"
      class="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
          <i class="pi pi-bell"></i>
        </div>
        <div>
          <h4 class="text-sm font-bold text-amber-900">
            Ada {{ metrics.pendingCount }} Pengeluaran Kas Menunggu Persetujuan
          </h4>
          <p class="text-xs text-amber-800 mt-0.5">
            Sebagai Ketua, Anda dapat memeriksa rincian dokumen pengeluaran dan memberikan otorisasi sebelum dana dicairkan.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <RouterLink
          to="/approvals"
          class="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap"
        >
          Tinjau Pengajuan &rarr;
        </RouterLink>
        <button
          @click="isPendingBannerOpen = false"
          class="text-amber-500 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-100 transition-colors"
          title="Tutup pemberitahuan"
        >
          <i class="pi pi-times text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Tombol Aksi Cepat Sesuai Peran -->
    <div class="flex flex-wrap gap-2.5">
      <template v-if="auth.isMaker()">
        <RouterLink
          to="/cash-in"
          class="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <i class="pi pi-plus"></i> Catat Kas Masuk
        </RouterLink>
        <RouterLink
          to="/cash-out"
          class="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <i class="pi pi-send"></i> Ajukan Kas Keluar
        </RouterLink>
      </template>

      <RouterLink
        to="/ledger"
        class="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <i class="pi pi-database text-primary"></i> Buku Besar Kas
      </RouterLink>

      <RouterLink
        to="/reports"
        class="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <i class="pi pi-file text-slate-600"></i> Laporan Keuangan
      </RouterLink>
    </div>

    <!-- Grid Metrik Utama: Responsif 2 Kolom di Tablet, 4 Kolom di Desktop -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Total Saldo Kas -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Saldo Kas</span>
            <i class="pi pi-wallet text-primary"></i>
          </div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-8 bg-slate-100 animate-pulse rounded mt-2 w-3/4"></div>
          <div v-else class="text-2xl font-bold text-primary tabular-nums mt-1">
            {{ formatRupiah(metrics.balance) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Terverifikasi di Blockchain</p>
        </template>
      </Card>

      <!-- 2. Pemasukan Bulan Ini (MTD) -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
            <span>Pemasukan Bulan Ini</span>
            <i class="pi pi-arrow-up-right text-emerald-600"></i>
          </div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-8 bg-slate-100 animate-pulse rounded mt-2 w-2/3"></div>
          <div v-else class="text-2xl font-bold text-emerald-600 tabular-nums mt-1">
            + {{ formatRupiah(metrics.incomeThisMonth) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Total Tahun Ini: {{ formatRupiah(metrics.incomeYTD) }}</p>
        </template>
      </Card>

      <!-- 3. Pengeluaran Bulan Ini (MTD) -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Pengeluaran Bulan Ini</span>
            <i class="pi pi-arrow-down-left text-slate-600"></i>
          </div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-8 bg-slate-100 animate-pulse rounded mt-2 w-2/3"></div>
          <div v-else class="text-2xl font-bold text-slate-800 tabular-nums mt-1">
            - {{ formatRupiah(metrics.expenseThisMonth) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Total Tahun Ini: {{ formatRupiah(metrics.expenseYTD) }}</p>
        </template>
      </Card>

      <!-- 4. Antrean Persetujuan / Total Tx -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Menunggu Persetujuan</span>
            <i class="pi pi-clock text-amber-500"></i>
          </div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-8 bg-slate-100 animate-pulse rounded mt-2 w-1/2"></div>
          <div
            v-else
            class="text-2xl font-bold tabular-nums mt-1 flex items-center gap-1.5"
            :class="metrics.pendingCount > 0 ? 'text-amber-600' : 'text-slate-700'"
          >
            {{ metrics.pendingCount }} Transaksi
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Total {{ metrics.totalTransactionsCount }} Transaksi</p>
        </template>
      </Card>
    </div>

    <!-- Tabel Transaksi Terkini -->
    <div class="bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 class="font-semibold text-slate-900 text-base">Transaksi Terkini</h3>
          <p class="text-xs text-slate-500">5 transaksi kas terbaru yang tercatat di sistem.</p>
        </div>
        <RouterLink to="/ledger" class="text-xs text-primary font-semibold hover:underline">
          Lihat Buku Besar Lengkap &rarr;
        </RouterLink>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th class="px-6 py-3.5">ID / Hash</th>
              <th class="px-6 py-3.5">Kategori & Deskripsi</th>
              <th class="px-6 py-3.5">Nominal</th>
              <th class="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Skeleton Loading -->
            <template v-if="isLoading">
              <tr v-for="i in 3" :key="'skel-' + i">
                <td class="px-6 py-4" colspan="4">
                  <div class="h-5 bg-slate-100 animate-pulse rounded w-full"></div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="recentTransactions.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-slate-500">
                Belum ada transaksi tercatat.
              </td>
            </tr>

            <!-- Render Data -->
            <template v-else>
              <tr
                v-for="tx in recentTransactions"
                :key="tx.id"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-mono text-slate-800 text-xs font-medium">
                    {{ tx.tx_hash ? `${tx.tx_hash.substring(0, 10)}...` : `#REQ-${tx.id}` }}
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">{{ formatDate(tx.created_at) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-800">{{ tx.category }}</div>
                  <div class="text-xs text-slate-500 truncate max-w-xs mt-0.5" :title="tx.description">
                    {{ tx.description }}
                  </div>
                </td>
                <td
                  class="px-6 py-4 font-semibold tabular-nums whitespace-nowrap"
                  :class="tx.type === 'cash_in' ? 'text-emerald-600' : 'text-slate-900'"
                >
                  {{ tx.type === 'cash_in' ? '+' : '-' }} {{ formatRupiah(tx.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    v-if="tx.status === 'completed'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                  >
                    <i class="pi pi-check-circle text-[10px]"></i> Selesai (On-Chain)
                  </span>
                  <span
                    v-else-if="tx.status === 'pending'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                  >
                    <i class="pi pi-clock text-[10px]"></i> Menunggu Ketua
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    <i class="pi pi-times-circle text-[10px]"></i> Ditolak
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
