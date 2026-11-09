<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const pendingRequests = ref<any[]>([])
const isLoading = ref(true)

// Ambil data pending dari backend saat halaman dibuka
const fetchPendingRequests = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/transactions?status=pending')
    pendingRequests.value = response.data.data || response.data // Sesuaikan dengan format response Indra
  } catch (error) {
    console.error('Gagal mengambil data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPendingRequests()
})

const handleApprove = async (id: number) => {
  const result = await Swal.fire({
    title: 'Setujui Transaksi?',
    text: 'Dana akan dipotong dari saldo organisasi.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#5B21B6',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Ya, Setujui',
    cancelButtonText: 'Batal',
  })

  if (result.isConfirmed) {
    try {
      await axios.post(`http://127.0.0.1:8000/api/transactions/${id}/approve`)

      Swal.fire({
        title: 'Disetujui!',
        text: 'Transaksi telah dicatat ke Ledger.',
        icon: 'success',
        confirmButtonColor: '#5B21B6',
      })
      fetchPendingRequests() // Refresh daftar
    } catch (error: any) {
      Swal.fire('Gagal!', error.response?.data?.message || 'Error server.', 'error')
    }
  }
}

const handleReject = async (id: number) => {
  const { value: reason } = await Swal.fire({
    title: 'Tolak Transaksi',
    input: 'textarea',
    inputLabel: 'Alasan Penolakan',
    inputPlaceholder: 'Tuliskan alasan pengajuan ini ditolak...',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Tolak',
    inputValidator: (value) => {
      if (!value) return 'Alasan wajib diisi!'
    },
  })

  if (reason) {
    try {
      await axios.post(`http://127.0.0.1:8000/api/transactions/${id}/reject`, {
        rejection_reason: reason,
      })

      Swal.fire({
        title: 'Ditolak!',
        text: 'Transaksi dikembalikan ke pembuat.',
        icon: 'success',
        confirmButtonColor: '#5B21B6',
      })
      fetchPendingRequests()
    } catch (error: any) {
      Swal.fire('Gagal!', error.response?.data?.message || 'Error server.', 'error')
    }
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="mb-6 flex justify-between items-end">
      <div>
        <h2 class="text-2xl font-semibold text-slate-900">Persetujuan Transaksi</h2>
        <p class="text-slate-500 mt-1">Review dan otorisasi pengajuan pengeluaran kas.</p>
      </div>
      <div
        class="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
      >
        <i class="pi pi-clock"></i>
        {{ pendingRequests.length }} Menunggu Persetujuan
      </div>
    </div>

    <!-- State Kosong jika tidak ada request -->
    <div
      v-if="pendingRequests.length === 0"
      class="bg-surface border border-slate-200 rounded-xl p-12 text-center shadow-sm"
    >
      <i class="pi pi-check-circle text-5xl text-emerald-500 mb-4"></i>
      <h3 class="text-lg font-semibold text-slate-900">Semua Beres!</h3>
      <p class="text-slate-500 mt-1">Tidak ada pengajuan yang menunggu persetujuan saat ini.</p>
    </div>

    <!-- Daftar Request -->
    <div v-else class="grid grid-cols-1 gap-6">
      <div
        v-for="req in pendingRequests"
        :key="req.id"
        class="bg-surface border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
      >
        <!-- Info Transaksi -->
        <div class="flex-1 space-y-3">
          <div class="flex items-center gap-3">
            <span
              class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md"
              >{{ req.id }}</span
            >
            <span class="text-sm text-slate-500"
              ><i class="pi pi-calendar mr-1"></i> {{ req.date }}</span
            >
          </div>

          <div>
            <h3 class="text-xl font-semibold text-slate-900 tabular-nums">{{ req.amount }}</h3>
            <p class="text-slate-700 font-medium mt-1">{{ req.description }}</p>
          </div>

          <div class="flex flex-wrap gap-4 text-sm text-slate-500">
            <div class="flex items-center gap-1.5">
              <i class="pi pi-tag text-xs"></i> Kategori: {{ req.category }}
            </div>
            <div class="flex items-center gap-1.5">
              <i class="pi pi-user text-xs"></i> Pengaju: {{ req.maker }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100"
        >
          <button
            class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <i class="pi pi-file"></i> Lihat Bukti
          </button>
          <div class="flex gap-3">
            <button
              @click="handleReject(req.id)"
              class="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <i class="pi pi-times"></i> Tolak
            </button>
            <button
              @click="handleApprove(req.id)"
              class="flex-1 md:flex-none px-4 py-2 bg-primary text-white border border-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <i class="pi pi-check"></i> Setujui
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
