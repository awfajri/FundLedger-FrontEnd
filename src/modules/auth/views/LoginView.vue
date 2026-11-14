<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { UserRole } from '../../../core/types/auth'

const auth = useAuthStore()
const email = ref('bendahara@sastramesin.org')
const password = ref('password123')
const errorMessage = ref('')
const isNetworkError = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  isNetworkError.value = false

  const result = await auth.login({
    email: email.value,
    password: password.value,
  })

  if (!result.success) {
    errorMessage.value = result.message || 'Email atau kata sandi tidak valid.'
    if (result.isNetworkError) {
      isNetworkError.value = true
    }
  }

  isLoading.value = false
}

// Preset Quick Fill sinkron dengan DatabaseSeeder backend Laravel Indra
const fillCredentials = (role: UserRole) => {
  errorMessage.value = ''
  isNetworkError.value = false

  if (role === 'maker') {
    email.value = 'bendahara@sastramesin.org'
    password.value = 'password123'
  } else if (role === 'checker') {
    email.value = 'ketua@sastramesin.org'
    password.value = 'password123'
  } else {
    email.value = 'antek@sastramesin.org'
    password.value = 'password123'
  }
}

const handleOfflineDemo = (role: UserRole = 'maker') => {
  auth.loginOfflineDemo(role)
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
      <!-- Brand Logo & Header -->
      <div class="text-center">
        <div class="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-md shadow-primary/20">
          FL
        </div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">FundLedger</h1>
        <p class="text-xs text-slate-500 mt-1">Sistem Pengelolaan & Transparansi Keuangan Berbasis Blockchain</p>
      </div>

      <!-- Form Login -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Error Message Alert -->
        <div
          v-if="errorMessage"
          class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium text-center space-y-2"
        >
          <div class="flex items-center justify-center gap-1.5">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Opsi Fallback Demo jika Backend Offline / Bermasalah -->
          <div v-if="isNetworkError" class="pt-2 border-t border-red-200">
            <p class="text-[11px] text-slate-600 mb-1.5">Ingin mencoba sistem menggunakan simulasi offline?</p>
            <button
              type="button"
              @click="handleOfflineDemo('maker')"
              class="px-3 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90"
            >
              Masuk Mode Demo (Bendahara) &rarr;
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Email Organisasi</label>
          <input
            type="email"
            v-model="email"
            required
            placeholder="nama@sastramesin.org"
            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
          <input
            type="password"
            v-model="password"
            required
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2 mt-2"
        >
          <i v-if="isLoading" class="pi pi-spinner animate-spin"></i>
          {{ isLoading ? 'Menghubungi Server...' : 'Masuk ke Sistem' }}
        </button>
      </form>

      <!-- Link ke Register -->
      <div class="text-center text-xs text-slate-600">
        Belum memiliki akun organisasi?
        <RouterLink to="/register" class="text-primary font-semibold hover:underline ml-1">
          Daftarkan Organisasi
        </RouterLink>
      </div>

      <!-- Quick Fill Role Presets untuk Presentasi & Pengujian -->
      <div class="pt-5 border-t border-slate-100">
        <p class="text-[11px] text-center font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Masuk Cepat Pengujian (Pilih Peran)
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="fillCredentials('maker')"
            class="py-2 px-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-primary rounded-lg text-xs font-semibold transition-colors text-center"
            title="Auf Japri (Bendahara)"
          >
            Bendahara (Maker)
          </button>
          <button
            type="button"
            @click="fillCredentials('checker')"
            class="py-2 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition-colors text-center"
            title="Mfik Kaaga (Ketua)"
          >
            Ketua (Checker)
          </button>
          <button
            type="button"
            @click="fillCredentials('viewer')"
            class="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
            title="Rahmat Stang (Anggota)"
          >
            Anggota (Viewer)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
