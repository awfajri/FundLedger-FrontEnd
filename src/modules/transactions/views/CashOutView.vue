<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const router = useRouter()
const isLoading = ref(false)

const form = ref({
  category: '',
  amount: null as number | null,
  description: '',
  proofFile: null as File | null,
})

const categories = [
  { label: 'Perlengkapan', value: 'perlengkapan' },
  { label: 'Konsumsi', value: 'konsumsi' },
  { label: 'Transportasi', value: 'transportasi' },
  { label: 'Operasional Lainnya', value: 'lainnya' },
]

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  form.value.proofFile = target.files?.[0] || null
}

const submitForm = async () => {
  if (!form.value.proofFile) {
    Swal.fire({
      title: 'Peringatan!',
      text: 'Harap unggah bukti nota/invoice.',
      icon: 'warning',
      confirmButtonColor: '#5B21B6',
    })
    return
  }

  isLoading.value = true

  try {
    const formData = new FormData()
    formData.append('type', 'cash_out')
    formData.append('category', form.value.category)
    formData.append('amount', String(form.value.amount))
    formData.append('description', form.value.description)
    formData.append('proof_path', form.value.proofFile)

    await axios.post('http://127.0.0.1:8000/api/transactions/cash-out', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    Swal.fire({
      title: 'Pengajuan Terkirim!',
      text: 'Menunggu persetujuan dari Ketua.',
      icon: 'success',
      confirmButtonColor: '#5B21B6',
    }).then(() => {
      router.push('/')
    })
  } catch (error: any) {
    Swal.fire({
      title: 'Gagal!',
      text: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      icon: 'error',
      confirmButtonColor: '#EF4444',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-slate-900">Pengajuan Cash Out</h2>
      <p class="text-slate-500 mt-1">Ajukan pengeluaran dana organisasi untuk disetujui.</p>
    </div>

    <div class="bg-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <form @submit.prevent="submitForm" class="p-8 space-y-6">
        <!-- Kategori -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Kategori Pengeluaran <span class="text-red-500">*</span></label
          >
          <select
            v-model="form.category"
            required
            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="" disabled selected>Pilih Kategori...</option>
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <!-- Nominal -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Nominal (Rp) <span class="text-red-500">*</span></label
          >
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
            <input
              type="number"
              v-model="form.amount"
              required
              min="1"
              placeholder="0"
              class="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <!-- Deskripsi -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Tujuan Penggunaan <span class="text-red-500">*</span></label
          >
          <textarea
            v-model="form.description"
            required
            rows="3"
            placeholder="Jelaskan untuk apa dana ini digunakan..."
            class="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
          ></textarea>
        </div>

        <!-- Unggah Bukti -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Bukti Pendukung (Nota/Invoice) <span class="text-red-500">*</span></label
          >
          <div
            class="border-2 border-dashed border-slate-300 rounded-lg px-6 py-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative"
          >
            <input
              type="file"
              @change="handleFileUpload"
              required
              accept="image/*,.pdf"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div v-if="!form.proofFile">
              <i class="pi pi-cloud-upload text-3xl text-slate-400 mb-3"></i>
              <p class="text-sm text-slate-600 font-medium">Klik atau drag file ke sini</p>
              <p class="text-xs text-slate-400 mt-1">PNG, JPG, atau PDF (Maks. 5MB)</p>
            </div>
            <div v-else class="flex flex-col items-center">
              <i class="pi pi-file text-3xl text-primary mb-2"></i>
              <p class="text-sm font-medium text-slate-700">{{ form.proofFile.name }}</p>
              <p class="text-xs text-primary mt-1 hover:underline">Ganti file</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <RouterLink
            to="/"
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </RouterLink>
          <button
            type="submit"
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            Ajukan Pengeluaran
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
