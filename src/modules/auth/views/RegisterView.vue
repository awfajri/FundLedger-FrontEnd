<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Swal from 'sweetalert2'
import { useAuthStore } from '../stores/auth'
import type { UserRole } from '../../../core/types/auth'

const router = useRouter()
const auth = useAuthStore()

const isLoading = ref(false)
const step = ref(1)

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  orgName: '',
  role: 'maker' as UserRole,
})

const handleNextStep = () => {
  if (!form.value.name || !form.value.email || !form.value.password) {
    Swal.fire('Peringatan', 'Harap lengkapi semua bidang.', 'warning')
    return
  }

  if (form.value.password !== form.value.password_confirmation) {
    Swal.fire('Peringatan', 'Konfirmasi kata sandi tidak cocok.', 'warning')
    return
  }

  step.value = 2
}

const submitRegistration = async () => {
  if (!form.value.orgName) {
    Swal.fire('Peringatan', 'Harap isi nama organisasi Anda.', 'warning')
    return
  }

  isLoading.value = true
  try {
    const res = await auth.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
      organization_name: form.value.orgName,
      role: form.value.role,
    })

    if (res.success) {
      Swal.fire({
        title: 'Registrasi Berhasil!',
        text: 'Organisasi Anda telah terdaftar di FundLedger. Silakan masuk.',
        icon: 'success',
        confirmButtonColor: '#5B21B6',
      }).then(() => {
        router.push('/login')
      })
    }
  } catch (error: any) {
    Swal.fire('Gagal', error.message || 'Registrasi gagal.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
      <div class="text-center">
        <div class="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-md shadow-primary/20">
          FL
        </div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Daftarkan Organisasi</h1>
        <p class="text-xs text-slate-500 mt-1">
          Sistem Pengelolaan Kas Transparan Berbasis Shared Blockchain Ledger
        </p>
      </div>

      <!-- Stepper Indicator -->
      <div class="flex items-center justify-center gap-3">
        <div class="flex items-center gap-2">
          <div
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              step === 1 ? 'bg-primary text-white' : 'bg-emerald-100 text-emerald-700',
            ]"
          >
            1
          </div>
          <span class="text-xs font-medium text-slate-700">Data Personal</span>
        </div>
        <div class="w-8 h-0.5 bg-slate-200"></div>
        <div class="flex items-center gap-2">
          <div
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              step === 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400',
            ]"
          >
            2
          </div>
          <span class="text-xs font-medium text-slate-700">Data Organisasi</span>
        </div>
      </div>

      <form @submit.prevent="step === 1 ? handleNextStep() : submitRegistration()" class="space-y-4">
        <!-- Step 1: Data Personal -->
        <div v-if="step === 1" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Contoh: Siti Sarah Rahmawati"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email Aktif</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="nama@sastramesin.org"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <input
                v-model="form.password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Sandi</label>
              <input
                v-model="form.password_confirmation"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm mt-3"
          >
            Lanjut ke Data Organisasi &rarr;
          </button>
        </div>

        <!-- Step 2: Data Organisasi -->
        <div v-else class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Organisasi / Komunitas</label>
            <input
              v-model="form.orgName"
              type="text"
              required
              placeholder="Contoh: HIMASASIN (Himpunan Mahasiswa Sastra Mesin)"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Peran Anda di Organisasi (RBAC)</label>
            <select
              v-model="form.role"
              required
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="maker">Bendahara (Maker - Inisiator Transaksi)</option>
              <option value="checker">Ketua (Checker - Otorisator Transaksi)</option>
            </select>
            <p class="text-[11px] text-slate-500 mt-1">
              Catatan: Peran dapat diatur dan anggota baru dapat diundang setelah registrasi.
            </p>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="step = 1"
              class="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              &larr; Kembali
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-2/3 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <i v-if="isLoading" class="pi pi-spinner animate-spin"></i>
              {{ isLoading ? 'Mendaftarkan...' : 'Selesaikan Registrasi' }}
            </button>
          </div>
        </div>
      </form>

      <div class="text-center text-xs text-slate-600">
        Sudah memiliki akun?
        <RouterLink to="/login" class="text-primary font-semibold hover:underline ml-1">
          Masuk ke Sistem
        </RouterLink>
      </div>
    </div>
  </div>
</template>
