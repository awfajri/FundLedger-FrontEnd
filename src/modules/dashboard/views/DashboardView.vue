<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Card from 'primevue/card'
import { useAuthStore } from '../../auth/stores/auth' // <-- Tambahkan ini

const auth = useAuthStore() // <-- Tambahkan ini
const isLoading = ref(true)

// State untuk 3 Metrik Atas
const metrics = ref({
  balance: 0,
  incomeThisMonth: 0,
  pendingCount: 0,
})

// State untuk Tabel Transaksi
const recentTransactions = ref<any[]>([])

// Helper: Format angka ke Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

// Helper: Format tanggal
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

// Tarik data dari API Laravel
const fetchDashboardData = async () => {
  isLoading.value = true

  // ==========================================
  // 1. Ambil Metrik Dashboard (Isolasi Error)
  // ==========================================
  try {
    // Coba tebak route Indra, kalau masih 404 nanti tanya ke Indra route tepatnya apa
    const resMetrics = await axios.get('http://127.0.0.1:8000/api/dashboard')
    const data = resMetrics.data.data || resMetrics.data

    metrics.value = {
      balance:
        parseFloat(data.balance || data.total_saldo) ||
        parseFloat(auth.user?.organization?.balance) ||
        0,
      incomeThisMonth: parseFloat(data.income_this_month || data.pemasukan_bulan_ini) || 0,
      pendingCount: parseInt(data.pending_count || data.total_pending) || 0,
    }
  } catch (error) {
    console.warn('⚠️ API Dashboard 404 / Belum siap. Menggunakan Saldo Fallback dari profil user.')
    // Fallback ambil saldo dari data user saat login
    metrics.value.balance = parseFloat(auth.user?.organization?.balance) || 0
  }

  // ==========================================
  // 2. Ambil Riwayat Transaksi (Isolasi Error)
  // ==========================================
  try {
    const resTx = await axios.get('http://127.0.0.1:8000/api/transactions?limit=5')

    let txData = resTx.data.data || resTx.data
    if (txData && txData.data) {
      txData = txData.data // Jika pakai pagination Laravel
    }

    recentTransactions.value = Array.isArray(txData) ? txData : []
  } catch (error) {
    console.error('❌ Gagal mengambil riwayat transaksi:', error)
  }

  isLoading.value = false
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex justify-between items-end">
      <h2 class="text-2xl font-semibold text-slate-900">Ringkasan Keuangan</h2>
      <button
        @click="fetchDashboardData"
        class="text-slate-400 hover:text-primary transition-colors"
        title="Refresh Data"
      >
        <i class="pi pi-refresh" :class="{ 'animate-spin': isLoading }"></i>
      </button>
    </div>

    <!-- Grid Metrik -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card Total Saldo -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-sm font-medium text-slate-500">Total Saldo (Off-Chain Cache)</div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-9 bg-slate-100 animate-pulse rounded mt-2 w-3/4"></div>
          <div v-else class="text-3xl font-semibold text-primary tabular-nums mt-2">
            {{ formatRupiah(metrics.balance) }}
          </div>
        </template>
      </Card>

      <!-- Card Pemasukan -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-sm font-medium text-slate-500">Pemasukan Bulan Ini</div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-8 bg-slate-100 animate-pulse rounded mt-2 w-2/3"></div>
          <div v-else class="text-2xl font-medium text-slate-800 tabular-nums mt-2">
            + {{ formatRupiah(metrics.incomeThisMonth) }}
          </div>
        </template>
      </Card>

      <!-- Card Pengeluaran -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-sm font-medium text-slate-500">Pengajuan Menunggu</div>
        </template>
        <template #content>
          <div v-if="isLoading" class="h-8 bg-slate-100 animate-pulse rounded mt-2 w-1/2"></div>
          <div
            v-else
            class="text-2xl font-medium text-orange-600 tabular-nums mt-2 flex items-center gap-2"
          >
            <i class="pi pi-clock"></i> {{ metrics.pendingCount }} Transaksi
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabel Transaksi Terbaru -->
    <div class="mt-8 bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-slate-900 text-lg">Transaksi Terbaru</h3>
        <button class="text-sm text-primary font-medium hover:underline">Lihat Semua</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th class="px-6 py-4 font-medium">ID / Hash</th>
              <th class="px-6 py-4 font-medium">Kategori</th>
              <th class="px-6 py-4 font-medium">Nominal</th>
              <th class="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <!-- Skeleton Loading dibungkus <template> -->
            <template v-if="isLoading">
              <tr v-for="i in 3" :key="'skel-' + i" class="border-b border-slate-100">
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-100 animate-pulse rounded w-24"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-100 animate-pulse rounded w-32"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-100 animate-pulse rounded w-20"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-6 bg-slate-100 animate-pulse rounded-full w-20"></div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="recentTransactions.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                Belum ada transaksi tercatat.
              </td>
            </tr>

            <!-- Data Render dibungkus <template> -->
            <template v-else>
              <tr
                v-for="tx in recentTransactions"
                :key="tx.id"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="font-mono text-slate-800 text-xs truncate max-w-[120px]">
                    {{ tx.tx_hash || `REQ-${tx.id}` }}
                  </div>
                  <div class="text-xs text-slate-400 mt-1">{{ formatDate(tx.created_at) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-slate-700">{{ tx.category }}</div>
                  <div class="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                    {{ tx.description }}
                  </div>
                </td>
                <td
                  class="px-6 py-4 font-medium tabular-nums"
                  :class="tx.type === 'cash_in' ? 'text-emerald-600' : 'text-slate-900'"
                >
                  {{ tx.type === 'cash_in' ? '+' : '-' }} {{ formatRupiah(tx.amount) }}
                </td>
                <td class="px-6 py-4">
                  <!-- Status Dinamis -->
                  <span
                    v-if="tx.status === 'completed'"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
                  >
                    <i class="pi pi-check-circle text-[10px]"></i> Selesai
                  </span>
                  <span
                    v-else-if="tx.status === 'pending'"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
                  >
                    <i class="pi pi-clock text-[10px]"></i> Menunggu
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
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
