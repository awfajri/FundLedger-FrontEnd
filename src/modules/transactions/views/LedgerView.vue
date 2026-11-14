<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { transactionService } from '../../../core/api/transactionService'
import { useAuthStore } from '../../auth/stores/auth'
import type { Transaction, TransactionType } from '../../../core/types/transaction'

const router = useRouter()
const auth = useAuthStore()

const transactions = ref<Transaction[]>([])
const isLoading = ref(true)
const selectedFilter = ref<'all' | TransactionType>('all')
const searchQuery = ref('')
const isBannerOpen = ref(true)

// State Modal Jurnal Pembalik (Reversing Entry)
const isReversalModalOpen = ref(false)
const selectedTxForReversal = ref<Transaction | null>(null)
const reversalReason = ref('')
const isSubmittingReversal = ref(false)

// State Modal Detail Hash
const isHashDetailModalOpen = ref(false)
const selectedTxDetail = ref<Transaction | null>(null)

const fetchTransactions = async () => {
  isLoading.value = true
  try {
    const data = await transactionService.getTransactions({ status: 'completed' })
    transactions.value = data
  } catch (error) {
    console.error('Gagal mengambil ledger:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchTransactions()
})

const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    const matchesFilter =
      selectedFilter.value === 'all' ? true : tx.type === selectedFilter.value

    const matchesSearch =
      searchQuery.value === ''
        ? true
        : tx.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          (tx.tx_hash && tx.tx_hash.toLowerCase().includes(searchQuery.value.toLowerCase()))

    return matchesFilter && matchesSearch
  })
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

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `${label} berhasil disalin!`,
    showConfirmButton: false,
    timer: 2000,
  })
}

// Buka Modal Jurnal Pembalik
const openReversalModal = (tx: Transaction) => {
  selectedTxForReversal.value = tx
  reversalReason.value = ''
  isReversalModalOpen.value = true
}

const closeReversalModal = () => {
  isReversalModalOpen.value = false
  selectedTxForReversal.value = null
  reversalReason.value = ''
}

// Eksekusi Jurnal Pembalik (Reversing Entry)
const submitReversal = async () => {
  if (!selectedTxForReversal.value) return
  if (!reversalReason.value.trim()) {
    Swal.fire('Peringatan', 'Harap isi alasan pembuatan jurnal pembalik.', 'warning')
    return
  }

  isSubmittingReversal.value = true

  try {
    const res = await transactionService.createReversingEntry({
      original_tx_id: selectedTxForReversal.value.id,
      original_tx_hash: selectedTxForReversal.value.tx_hash || '',
      reason: reversalReason.value.trim(),
    })

    if (res.success) {
      Swal.fire({
        title: 'Jurnal Pembalik Berhasil Dibuat!',
        text: 'Transaksi pembalik telah dicatat di blockchain ledger dan saldo telah diselaraskan.',
        icon: 'success',
        confirmButtonColor: '#5B21B6',
      })
      closeReversalModal()
      await fetchTransactions()
    } else {
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses jurnal pembalik.', 'error')
    }
  } catch (err: any) {
    Swal.fire('Gagal', err.message || 'Error server.', 'error')
  } finally {
    isSubmittingReversal.value = false
  }
}

const openHashDetail = (tx: Transaction) => {
  selectedTxDetail.value = tx
  isHashDetailModalOpen.value = true
}

const navigateToAudit = (hash?: string) => {
  if (!hash) return
  isHashDetailModalOpen.value = false
  router.push({ path: '/audit', query: { hash } })
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header Halaman -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Buku Besar Kas (Ledger On-Chain)</h2>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-primary border border-purple-200">
            <i class="pi pi-verified text-[11px]"></i> Terverifikasi On-Chain
          </span>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Seluruh riwayat penerimaan dan pengeluaran kas organisasi yang telah diverifikasi dan terkunci permanen di blockchain.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="fetchTransactions"
          class="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          title="Segarkan Ledger"
        >
          <i class="pi pi-refresh" :class="{ 'animate-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- Alert Banner Collapsible: Karakteristik Buku Besar Permanen -->
    <div
      v-if="isBannerOpen"
      class="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 text-xs text-slate-700 flex items-start justify-between gap-3 shadow-sm transition-all"
    >
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-100 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <i class="pi pi-lock text-sm"></i>
        </div>
        <div>
          <span class="font-bold text-slate-900 block text-sm mb-0.5">Karakteristik Buku Besar Permanen (Immutable)</span>
          <p class="text-slate-600 leading-relaxed">
            Data transaksi yang telah disetujui bersifat permanen di blockchain dan tidak dapat diubah atau dihapus. Jika terjadi kesalahan administratif, pembetulan dilakukan secara transparan melalui transaksi <strong>Jurnal Pembalik (Reversing Entry)</strong> yang menyeimbangkan saldo tanpa menghilangkan jejak historis.
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

    <!-- Toolbar: Filter & Search -->
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <!-- Tabs Filter Jenis Transaksi -->
      <div class="inline-flex p-1 bg-slate-100 rounded-lg text-sm font-medium">
        <button
          @click="selectedFilter = 'all'"
          :class="[
            'px-3.5 py-1.5 rounded-md transition-colors',
            selectedFilter === 'all'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
        >
          Semua ({{ transactions.length }})
        </button>
        <button
          @click="selectedFilter = 'cash_in'"
          :class="[
            'px-3.5 py-1.5 rounded-md transition-colors',
            selectedFilter === 'cash_in'
              ? 'bg-white text-emerald-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
        >
          Pemasukan (Cash In)
        </button>
        <button
          @click="selectedFilter = 'cash_out'"
          :class="[
            'px-3.5 py-1.5 rounded-md transition-colors',
            selectedFilter === 'cash_out'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
        >
          Pengeluaran (Cash Out)
        </button>
        <button
          @click="selectedFilter = 'reversal'"
          :class="[
            'px-3.5 py-1.5 rounded-md transition-colors',
            selectedFilter === 'reversal'
              ? 'bg-white text-indigo-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900',
          ]"
        >
          Jurnal Pembalik
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari deskripsi, kategori, hash..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>
    </div>

    <!-- Tabel Ledger -->
    <div class="bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th class="px-6 py-4">ID / Waktu</th>
              <th class="px-6 py-4">Jenis & Kategori</th>
              <th class="px-6 py-4">Nominal</th>
              <th class="px-6 py-4">Pengesah (Validator)</th>
              <th class="px-6 py-4">Transaction Hash</th>
              <th class="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-100">
            <!-- Loading Skeletons -->
            <template v-if="isLoading">
              <tr v-for="i in 4" :key="'skel-' + i">
                <td class="px-6 py-4" colspan="6">
                  <div class="h-6 bg-slate-100 animate-pulse rounded w-full"></div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="filteredTransactions.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                <i class="pi pi-database text-3xl text-slate-300 mb-2 block"></i>
                Tidak ada data transaksi yang cocok dengan filter.
              </td>
            </tr>

            <!-- Render Data -->
            <template v-else>
              <tr
                v-for="tx in filteredTransactions"
                :key="tx.id"
                :class="[
                  'hover:bg-slate-50/80 transition-colors',
                  tx.is_reversal ? 'bg-indigo-50/30' : '',
                ]"
              >
                <!-- Kolom ID & Waktu -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-slate-900">#TX-{{ tx.id }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ formatDate(tx.created_at) }}</div>
                  <div v-if="tx.block_number" class="text-[11px] font-mono text-purple-700 mt-0.5">
                    Block #{{ tx.block_number }}
                  </div>
                </td>

                <!-- Kolom Jenis & Kategori -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="tx.type === 'cash_in'"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
                    >
                      Cash In
                    </span>
                    <span
                      v-else-if="tx.type === 'cash_out'"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"
                    >
                      Cash Out
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      <i class="pi pi-replay text-[10px] mr-1"></i> Reversal
                    </span>
                    <span class="font-medium text-slate-800">{{ tx.category }}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs" :title="tx.description">
                    {{ tx.description }}
                  </div>
                </td>

                <!-- Kolom Nominal -->
                <td class="px-6 py-4 whitespace-nowrap font-medium tabular-nums">
                  <span
                    :class="[
                      tx.type === 'cash_in'
                        ? 'text-emerald-600'
                        : tx.type === 'cash_out'
                          ? 'text-slate-900'
                          : 'text-indigo-600',
                    ]"
                  >
                    {{ tx.type === 'cash_in' ? '+' : tx.type === 'cash_out' ? '-' : '⇄' }}
                    {{ formatRupiah(tx.amount) }}
                  </span>
                </td>

                <!-- Kolom Pengesah -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-slate-800 text-xs font-medium">
                    {{ tx.checker_name || 'Ketua (Otorisator)' }}
                  </div>
                  <div class="text-[11px] font-mono text-slate-400 mt-0.5">
                    {{ tx.checker_wallet_address || '0x71C...a19C' }}
                  </div>
                </td>

                <!-- Kolom Tx Hash -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <button
                      @click="openHashDetail(tx)"
                      class="font-mono text-xs text-primary hover:underline bg-purple-50 px-2 py-1 rounded border border-purple-200"
                      title="Lihat detail hash on-chain"
                    >
                      {{ tx.tx_hash ? `${tx.tx_hash.substring(0, 10)}...${tx.tx_hash.substring(tx.tx_hash.length - 6)}` : '-' }}
                    </button>
                    <button
                      v-if="tx.tx_hash"
                      @click="copyToClipboard(tx.tx_hash, 'Hash Transaksi')"
                      class="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                      title="Salin Hash"
                    >
                      <i class="pi pi-copy text-xs"></i>
                    </button>
                    <button
                      v-if="tx.tx_hash"
                      @click="navigateToAudit(tx.tx_hash)"
                      class="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-100 bg-purple-50/60"
                      title="Verifikasi hash ini di halaman audit"
                    >
                      <i class="pi pi-shield text-xs"></i>
                    </button>
                  </div>
                  <div v-if="tx.reversing_hash" class="text-[11px] text-indigo-600 mt-0.5">
                    Reversal of: {{ tx.reversing_hash.substring(0, 8) }}...
                  </div>
                </td>

                <!-- Kolom Aksi -->
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <!-- Tombol Buat Jurnal Pembalik (Hanya untuk Maker jika transaksi bukan reversal) -->
                  <button
                    v-if="auth.isMaker() && !tx.is_reversal"
                    @click="openReversalModal(tx)"
                    class="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors inline-flex items-center gap-1"
                    title="Buat Jurnal Pembalik untuk transaksi ini"
                  >
                    <i class="pi pi-undo text-[10px]"></i>
                    Koreksi
                  </button>
                  <span v-else-if="tx.is_reversal" class="text-xs text-slate-400 italic">
                    Entri Pembalik
                  </span>
                  <span v-else class="text-xs text-slate-400">-</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Jurnal Pembalik (Reversing Entry) -->
    <div
      v-if="isReversalModalOpen && selectedTxForReversal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Ajukan Jurnal Pembalik (Koreksi Transaksi)</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Lakukan koreksi kekeliruan pencatatan tanpa mengubah atau menghapus data transaksi asli.
            </p>
          </div>
          <button @click="closeReversalModal" class="text-slate-400 hover:text-slate-600">
            <i class="pi pi-times text-lg"></i>
          </button>
        </div>

        <!-- Detail Transaksi yang Akan Dibalik -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">ID Transaksi:</span>
            <span class="font-semibold text-slate-800">#TX-{{ selectedTxForReversal.id }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Jenis & Kategori:</span>
            <span class="font-medium text-slate-800">{{ selectedTxForReversal.category }} ({{ selectedTxForReversal.type }})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Nominal:</span>
            <span class="font-semibold text-primary tabular-nums">{{ formatRupiah(selectedTxForReversal.amount) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Hash Referensi:</span>
            <span class="font-mono text-[11px] text-slate-700">{{ selectedTxForReversal.tx_hash?.substring(0, 16) }}...</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Alasan Koreksi Pembalikan <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="reversalReason"
            rows="3"
            required
            placeholder="Contoh: Kesalahan input nominal kelebihan Rp500.000 atau salah kategori pengeluaran..."
            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          ></textarea>
          <p class="text-[11px] text-slate-500 mt-1">
            Transaksi pembalik akan mencatat arus kas berlawanan sebesar nominal asli dan menerbitkan hash on-chain baru.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="closeReversalModal"
            class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            @click="submitReversal"
            :disabled="isSubmittingReversal"
            class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
          >
            <i v-if="isSubmittingReversal" class="pi pi-spinner animate-spin"></i>
            {{ isSubmittingReversal ? 'Memproses...' : 'Kirim Jurnal Pembalik' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detail Hash On-Chain -->
    <div
      v-if="isHashDetailModalOpen && selectedTxDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-purple-100 text-primary rounded-lg">
              <i class="pi pi-box text-xl"></i>
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-900">Bukti Kriptografis On-Chain</h3>
              <p class="text-xs text-slate-500">Smart Contract State Record</p>
            </div>
          </div>
          <button @click="isHashDetailModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <i class="pi pi-times text-lg"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span class="text-slate-500 block">Transaction Hash (Keccak256):</span>
            <div class="font-mono text-slate-900 break-all bg-white p-2 rounded border border-slate-200 mt-1 flex justify-between items-center">
              <span>{{ selectedTxDetail.tx_hash }}</span>
              <button @click="copyToClipboard(selectedTxDetail.tx_hash || '', 'Hash')" class="text-primary hover:text-primary/80 ml-2">
                <i class="pi pi-copy"></i>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-slate-500 block">Nomor Blok:</span>
              <span class="font-mono font-medium text-slate-800">#{{ selectedTxDetail.block_number || 6842109 }}</span>
            </div>
            <div>
              <span class="text-slate-500 block">Jaringan:</span>
              <span class="font-medium text-slate-800">Ethereum EVM (Sepolia)</span>
            </div>
          </div>

          <div>
            <span class="text-slate-500 block">Otorisator Wallet Address:</span>
            <span class="font-mono text-slate-800 font-medium">{{ selectedTxDetail.checker_wallet_address || '0x71C...a19C' }}</span>
          </div>

          <div>
            <span class="text-slate-500 block">Status Konsensus:</span>
            <span class="inline-flex items-center gap-1 text-emerald-700 font-semibold mt-0.5">
              <i class="pi pi-check-circle text-xs"></i> Finalized & Immutable
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button
            type="button"
            @click="navigateToAudit(selectedTxDetail.tx_hash)"
            class="px-4 py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <i class="pi pi-shield"></i>
            Verifikasi di Halaman Audit
          </button>
          <button
            type="button"
            @click="isHashDetailModalOpen = false"
            class="px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
