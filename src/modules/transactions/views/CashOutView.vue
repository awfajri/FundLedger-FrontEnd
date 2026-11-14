<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { transactionService } from '../../../core/api/transactionService'
import { useAuthStore } from '../../auth/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const isLoading = ref(false)
const currentBalance = ref<number>(auth.user?.organization?.balance || 14750000)

const form = ref({
  category: '',
  amount: null as number | null,
  description: '',
  proofFile: null as File | null,
})

const filePreview = ref<string | null>(null)
const fileName = ref<string>('')
const isPdf = ref(false)

const errors = ref({
  category: '',
  amount: '',
  description: '',
  proofFile: '',
})

const categories = [
  { label: 'Perlengkapan & Logistik', value: 'Perlengkapan' },
  { label: 'Konsumsi Kegiatan', value: 'Konsumsi' },
  { label: 'Transportasi & Operasional', value: 'Transportasi' },
  { label: 'Sewa Tempat & Vendor', value: 'Sewa' },
  { label: 'Publikasi & Dokumentasi', value: 'Publikasi' },
  { label: 'Lainnya', value: 'Lainnya' },
]

onMounted(async () => {
  try {
    const metrics = await transactionService.getMetrics()
    currentBalance.value = metrics.balance
  } catch {
    // Gunakan fallback
  }
})

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  errors.value.proofFile = ''

  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      errors.value.proofFile = 'Ukuran berkas maksimal 2MB (sesuai batas server).'
      return
    }

    form.value.proofFile = file
    fileName.value = file.name
    isPdf.value = file.type === 'application/pdf'

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreview.value = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      filePreview.value = null
    }
  }
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const formattedAmountDisplay = computed(() => {
  if (!form.value.amount) return ''
  return formatRupiah(form.value.amount)
})

// Pengecekan apakah saldo mencukupi
const isBalanceInsufficient = computed(() => {
  if (!form.value.amount) return false
  return form.value.amount > currentBalance.value
})

const validate = (): boolean => {
  let valid = true
  errors.value = { category: '', amount: '', description: '', proofFile: '' }

  if (!form.value.category) {
    errors.value.category = 'Pilih kategori pengeluaran.'
    valid = false
  }

  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Nominal harus lebih besar dari Rp 0.'
    valid = false
  } else if (isBalanceInsufficient.value) {
    errors.value.amount = `Saldo kas tidak mencukupi (Tersedia: ${formatRupiah(currentBalance.value)}).`
    valid = false
  }

  if (!form.value.description || form.value.description.trim().length < 5) {
    errors.value.description = 'Deskripsi tujuan pengeluaran minimal 5 karakter.'
    valid = false
  }

  if (!form.value.proofFile) {
    errors.value.proofFile = 'Harap unggah bukti nota / invoice / proposal pengeluaran.'
    valid = false
  }

  return valid
}

const submitForm = async () => {
  if (!validate()) return

  isLoading.value = true

  try {
    const formData = new FormData()
    formData.append('type', 'cash_out')
    formData.append('category', form.value.category)
    formData.append('amount', String(form.value.amount))
    formData.append('description', form.value.description)
    if (form.value.proofFile) {
      formData.append('proof', form.value.proofFile)
      formData.append('proof_path', form.value.proofFile)
    }

    const res = await transactionService.createCashOut(formData)

    if (res.success) {
      Swal.fire({
        title: 'Pengajuan Berhasil Dikirim!',
        text: 'Permohonan pengeluaran kas telah diteruskan ke Ketua (Checker) untuk ditinjau dan disetujui.',
        icon: 'success',
        confirmButtonColor: '#5B21B6',
      }).then(() => {
        router.push('/')
      })
    }
  } catch (error: any) {
    Swal.fire('Gagal!', error.message || 'Terjadi kesalahan sistem.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Pengajuan Kas Keluar</h2>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">
        Ajukan permohonan pengeluaran kas organisasi. Pengajuan akan diteruskan ke Ketua untuk diverifikasi sebelum dicatat ke blockchain.
      </p>
    </div>

    <!-- Banner Info Saldo Saat Ini -->
    <div class="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 flex justify-between items-center text-xs shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-purple-100 text-primary flex items-center justify-center font-bold">
          <i class="pi pi-wallet text-sm"></i>
        </div>
        <div>
          <span class="text-slate-500 font-medium">Saldo Kas Tersedia:</span>
          <div class="text-lg font-bold text-primary tabular-nums mt-0.5">
            {{ formatRupiah(currentBalance) }}
          </div>
        </div>
      </div>
      <span class="text-[11px] bg-white px-2.5 py-1 rounded-md text-primary font-semibold border border-purple-200 shadow-2xs">
        Terverifikasi On-Chain
      </span>
    </div>

    <div class="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
      <form @submit.prevent="submitForm" class="space-y-5">
        <!-- Kategori Pengeluaran -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Kategori Pengeluaran <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.category"
            class="w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
            :class="errors.category ? 'border-red-500' : 'border-slate-300'"
          >
            <option value="" disabled selected>Pilih Kategori Pengeluaran...</option>
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
          <p v-if="errors.category" class="text-xs text-red-600 mt-1">{{ errors.category }}</p>
        </div>

        <!-- Nominal (Rupiah) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Nominal Pengeluaran (IDR) <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rp</span>
            <input
              type="number"
              v-model="form.amount"
              min="1000"
              placeholder="0"
              class="w-full pl-11 pr-4 py-2.5 bg-white border rounded-lg text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
              :class="errors.amount || isBalanceInsufficient ? 'border-red-500' : 'border-slate-300'"
            />
          </div>

          <div v-if="formattedAmountDisplay" class="text-xs text-slate-600 font-medium mt-1">
            Terbaca: {{ formattedAmountDisplay }}
          </div>

          <!-- Alert jika Saldo Kas Tidak Mencukupi -->
          <div
            v-if="isBalanceInsufficient"
            class="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-1.5"
          >
            <i class="pi pi-exclamation-triangle"></i>
            Saldo kas tidak mencukupi! Maksimal pengeluaran adalah {{ formatRupiah(currentBalance) }}.
          </div>

          <p v-else-if="errors.amount" class="text-xs text-red-600 mt-1">{{ errors.amount }}</p>
        </div>

        <!-- Deskripsi / Tujuan Pengeluaran -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Tujuan / Alasan Pengeluaran <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Jelaskan kebutuhan pengeluaran dana secara rinci..."
            class="w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
            :class="errors.description ? 'border-red-500' : 'border-slate-300'"
          ></textarea>
          <p v-if="errors.description" class="text-xs text-red-600 mt-1">{{ errors.description }}</p>
        </div>

        <!-- Upload Bukti Nota / Invoice -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Unggah Bukti Nota / Invoice / Dokumen Pengajuan <span class="text-red-500">*</span>
          </label>
          <div
            class="border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer"
            :class="errors.proofFile ? 'border-red-400 bg-red-50/20' : 'border-slate-300'"
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              @change="handleFileUpload"
              class="hidden"
              id="proofUploadCashOut"
            />
            <label for="proofUploadCashOut" class="cursor-pointer block">
              <i class="pi pi-cloud-upload text-3xl text-slate-400 mb-1.5 block"></i>
              <span class="text-xs font-semibold text-primary">Pilih berkas nota / invoice</span>
              <span class="text-[11px] text-slate-400 block mt-0.5">Mendukung format JPG, PNG, atau PDF (Maks. 2MB)</span>
            </label>
          </div>

          <div v-if="fileName" class="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-700 truncate">
              <i :class="isPdf ? 'pi pi-file-pdf text-red-500 text-lg' : 'pi pi-image text-emerald-600 text-lg'"></i>
              <span class="font-medium truncate">{{ fileName }}</span>
            </div>
            <span class="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">Siap diunggah</span>
          </div>

          <div v-if="filePreview" class="mt-3">
            <img :src="filePreview" alt="Preview Bukti" class="max-h-48 rounded-lg border border-slate-200 object-contain mx-auto" />
          </div>

          <p v-if="errors.proofFile" class="text-xs text-red-600 mt-1">{{ errors.proofFile }}</p>
        </div>

        <!-- Submit Button -->
        <div class="pt-3">
          <button
            type="submit"
            :disabled="isLoading || isBalanceInsufficient"
            class="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <i v-if="isLoading" class="pi pi-spinner animate-spin"></i>
            {{ isLoading ? 'Mengirim Pengajuan...' : 'Ajukan Pengeluaran Dana' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
