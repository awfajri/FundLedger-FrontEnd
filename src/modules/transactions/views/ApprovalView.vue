<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { transactionService } from '../../../core/api/transactionService'
import { useAuthStore } from '../../auth/stores/auth'
import type { Transaction } from '../../../core/types/transaction'

const auth = useAuthStore()

const pendingRequests = ref<Transaction[]>([])
const isLoading = ref(true)
const isActionLoading = ref(false)
const isBannerOpen = ref(true)

// State Modal Detail & Review
const isDetailModalOpen = ref(false)
const selectedTx = ref<Transaction | null>(null)

const fetchPendingRequests = async () => {
  isLoading.value = true
  try {
    const data = await transactionService.getTransactions({ status: 'pending' })
    pendingRequests.value = data
  } catch (error) {
    console.error('Gagal mengambil antrean persetujuan:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPendingRequests()
})

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

const openDetailModal = (tx: Transaction) => {
  selectedTx.value = tx
  isDetailModalOpen.value = true
}

const handleApprove = async (tx: Transaction) => {
  // Pemisahan Wewenang (Dual Control): Pembuat transaksi tidak dapat menyetujui transaksi miliknya sendiri
  if (tx.maker_id === auth.user?.id) {
    Swal.fire({
      title: 'Pemisahan Wewenang (Dual Control)',
      text: 'Anda tidak dapat menyetujui pengajuan pengeluaran yang Anda buat sendiri. Persetujuan harus dilakukan oleh pengesah independen.',
      icon: 'warning',
      confirmButtonColor: '#5B21B6',
    })
    return
  }

  const result = await Swal.fire({
    title: 'Otorisasi & Tanda Tangani Transaksi?',
    html: `
      <p class="text-sm text-slate-600 mb-2">Anda akan menandatangani pengeluaran sebesar <strong>${formatRupiah(tx.amount)}</strong>.</p>
      <div class="p-3 bg-purple-50 text-primary text-xs rounded-lg text-left border border-purple-200">
        <i class="pi pi-shield mr-1"></i> Transaksi akan dikirim ke Smart Contract EVM dan dicatat secara permanen di blockchain ledger.
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#5B21B6',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Setujui & Tulis On-Chain',
    cancelButtonText: 'Batal',
  })

  if (result.isConfirmed) {
    isActionLoading.value = true
    try {
      const res = await transactionService.approveTransaction(tx.id)

      if (res.success) {
        Swal.fire({
          title: 'Pengeluaran Disetujui!',
          html: `
            <p class="text-xs text-slate-600">Transaksi berhasil dicatat ke dalam Ledger On-Chain.</p>
            <div class="mt-2 p-2 bg-slate-100 rounded text-[11px] font-mono break-all text-slate-800">
              Tx Hash: ${res.tx_hash}
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#5B21B6',
        })
        isDetailModalOpen.value = false
        await fetchPendingRequests()
      } else {
        Swal.fire('Gagal', 'Terjadi kesalahan saat memproses otorisasi.', 'error')
      }
    } catch (error: any) {
      Swal.fire('Gagal!', error.message || 'Error server.', 'error')
    } finally {
      isActionLoading.value = false
    }
  }
}

const handleReject = async (tx: Transaction) => {
  // Pemisahan Wewenang: Pembuat transaksi tidak dapat menolak transaksi miliknya sendiri
  if (tx.maker_id === auth.user?.id) {
    Swal.fire({
      title: 'Pemisahan Wewenang (Dual Control)',
      text: 'Anda tidak dapat menolak pengajuan pengeluaran yang Anda buat sendiri.',
      icon: 'warning',
      confirmButtonColor: '#5B21B6',
    })
    return
  }

  const { value: reason } = await Swal.fire({
    title: 'Tolak Pengajuan Kas Keluar',
    input: 'textarea',
    inputLabel: 'Alasan Penolakan:',
    inputPlaceholder: 'Tuliskan catatan perbaikan atau alasan penolakan untuk Bendahara...',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Tolak Pengajuan',
    cancelButtonText: 'Batal',
    inputValidator: (value) => {
      if (!value || value.trim().length < 5) {
        return 'Harap masukkan alasan penolakan minimal 5 karakter.'
      }
    },
  })

  if (reason) {
    isActionLoading.value = true
    try {
      const res = await transactionService.rejectTransaction(tx.id, reason)

      if (res.success) {
        Swal.fire({
          title: 'Pengajuan Ditolak',
          text: 'Transaksi telah berstatus Ditolak dan dikembalikan dengan catatan ke Bendahara.',
          icon: 'info',
          confirmButtonColor: '#5B21B6',
        })
        isDetailModalOpen.value = false
        await fetchPendingRequests()
      }
    } catch (error: any) {
      Swal.fire('Gagal!', error.message || 'Error server.', 'error')
    } finally {
      isActionLoading.value = false
    }
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Persetujuan Kas Keluar</h2>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Hak Akses: Ketua (Checker)
          </span>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Tinjau pengajuan pengeluaran kas, verifikasi berkas nota/proposal, dan otorisasi transaksi sebelum dicatat ke blockchain.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
          <i class="pi pi-clock"></i>
          {{ pendingRequests.length }} Pengajuan Menunggu
        </div>
        <button
          @click="fetchPendingRequests"
          class="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          title="Segarkan Antrean"
        >
          <i class="pi pi-refresh" :class="{ 'animate-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- Alert Banner Collapsible: Pemisahan Tugas (Dual Control) -->
    <div
      v-if="isBannerOpen"
      class="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 text-xs text-slate-700 flex items-start justify-between gap-3 shadow-sm transition-all"
    >
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-100 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <i class="pi pi-shield text-sm"></i>
        </div>
        <div>
          <span class="font-bold text-slate-900 block text-sm mb-0.5">Prinsip Pemisahan Tugas (Dual Control)</span>
          <p class="text-slate-600 leading-relaxed">
            Untuk menjaga transparansi kas dan mencegah konflik wewenang, pengajuan pengeluaran kas oleh Bendahara (Maker) wajib diverifikasi secara independen oleh Ketua (Checker). Transaksi yang disetujui akan ditandatangani secara digital dan tercatat permanen di blockchain ledger.
          </p>
        </div>
      </div>
      <button
        @click="isBannerOpen = false"
        class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-purple-100 transition-colors shrink-0"
        title="Tutup pemberitahuan"
      >
        <i class="pi pi-times text-xs"></i>
      </button>
    </div>

    <!-- Daftar Kartu / Tabel Antrean -->
    <div class="bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th class="px-6 py-4">ID / Tanggal</th>
              <th class="px-6 py-4">Pengaju (Maker)</th>
              <th class="px-6 py-4">Kategori & Keperluan</th>
              <th class="px-6 py-4">Nominal Pengeluaran</th>
              <th class="px-6 py-4 text-center">Tindakan Otorisasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Skeleton Loading -->
            <template v-if="isLoading">
              <tr v-for="i in 3" :key="'skel-' + i">
                <td class="px-6 py-4" colspan="5">
                  <div class="h-6 bg-slate-100 animate-pulse rounded w-full"></div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="pendingRequests.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                <i class="pi pi-check-circle text-4xl text-emerald-400 mb-2 block"></i>
                <p class="font-medium text-slate-800">Semua Beres!</p>
                <p class="text-xs text-slate-500 mt-1">Tidak ada pengajuan pengeluaran kas yang menunggu persetujuan.</p>
              </td>
            </tr>

            <!-- Render Data Pengajuan -->
            <template v-else>
              <tr
                v-for="tx in pendingRequests"
                :key="tx.id"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-mono font-medium text-slate-900 text-xs">#REQ-{{ tx.id }}</span>
                  <div class="text-[11px] text-slate-400 mt-0.5">{{ formatDate(tx.created_at) }}</div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-slate-800 text-xs">{{ tx.maker_name || 'Bendahara' }}</div>
                  <span class="inline-block text-[10px] bg-purple-50 text-primary px-1.5 py-0.5 rounded border border-purple-200 mt-0.5">
                    Maker
                  </span>
                </td>

                <td class="px-6 py-4">
                  <div class="font-medium text-slate-800">{{ tx.category }}</div>
                  <div class="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs" :title="tx.description">
                    {{ tx.description }}
                  </div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap font-bold text-slate-900 tabular-nums">
                  {{ formatRupiah(tx.amount) }}
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openDetailModal(tx)"
                      class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      title="Lihat Detail & Bukti"
                    >
                      <i class="pi pi-eye"></i> Detail
                    </button>
                    <button
                      @click="handleApprove(tx)"
                      class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      title="Setujui dan Sign ke Blockchain"
                    >
                      <i class="pi pi-check"></i> Setujui
                    </button>
                    <button
                      @click="handleReject(tx)"
                      class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors border border-red-200"
                      title="Tolak Pengajuan"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Review & Detail Pengajuan -->
    <div
      v-if="isDetailModalOpen && selectedTx"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Detail Pengajuan Kas #REQ-{{ selectedTx.id }}</h3>
            <p class="text-xs text-slate-500">Periksa bukti dan kelayakan sebelum otorisasi on-chain.</p>
          </div>
          <button @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <i class="pi pi-times text-lg"></i>
          </button>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Kategori:</span>
            <span class="font-semibold text-slate-800">{{ selectedTx.category }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Nominal:</span>
            <span class="font-bold text-primary text-sm tabular-nums">{{ formatRupiah(selectedTx.amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Diajukan Oleh:</span>
            <span class="font-medium text-slate-800">{{ selectedTx.maker_name || 'Bendahara' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Waktu Pengajuan:</span>
            <span class="text-slate-700">{{ formatDate(selectedTx.created_at) }}</span>
          </div>
          <div class="pt-2 border-t border-slate-200">
            <span class="text-slate-500 block mb-1">Keterangan / Tujuan:</span>
            <p class="text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
              {{ selectedTx.description }}
            </p>
          </div>
        </div>

        <!-- Berkas Bukti Lampiran -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-700">Dokumen Bukti Lampiran (Nota/Proposal):</label>
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <i class="pi pi-file-pdf text-red-500 text-xl"></i>
              <div>
                <span class="font-medium text-slate-800 block">Kwitansi_Invoice_Kegiatan.pdf</span>
                <span class="text-[10px] text-slate-400">Ukuran: 1.2 MB • Terlampir</span>
              </div>
            </div>
            <button
              class="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-50"
              @click="Swal.fire('Preview Dokumen', 'Pratinjau berkas nota invoice terverifikasi.', 'info')"
            >
              Lihat Berkas
            </button>
          </div>
        </div>

        <!-- Tombol Aksi Otorisasi -->
        <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            @click="handleReject(selectedTx)"
            :disabled="isActionLoading"
            class="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50"
          >
            Tolak Pengajuan
          </button>
          <button
            type="button"
            @click="handleApprove(selectedTx)"
            :disabled="isActionLoading"
            class="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
          >
            <i class="pi pi-check"></i>
            Setujui & Tulis ke Blockchain
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
