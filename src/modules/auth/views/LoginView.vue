<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth' // <-- Path diperbaiki

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  const result = await auth.login({
    email: email.value,
    password: password.value,
  })

  if (!result.success) {
    errorMessage.value = result.message
  }

  isLoading.value = false
}

// Fungsi pembantu untuk mode simulasi presentasi
const fillCredentials = (role: 'maker' | 'checker') => {
  if (role === 'maker') {
    email.value = 'bendahara@himtika.org'
    password.value = 'password123'
  } else {
    email.value = 'ketua@himtika.org'
    password.value = 'password123'
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-surface border border-slate-200 rounded-2xl shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary tracking-tight">FundLedger</h1>
        <p class="text-slate-500 mt-2">Masuk ke sistem pengelolaan keuangan</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Error Message Alert -->
        <div
          v-if="errorMessage"
          class="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium text-center"
        >
          {{ errorMessage }}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email Organisasi</label>
          <input
            type="email"
            v-model="email"
            required
            placeholder="nama@organisasi.org"
            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            v-model="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
        >
          <i v-if="isLoading" class="pi pi-spinner animate-spin"></i>
          {{ isLoading ? 'Memeriksa...' : 'Masuk Sistem' }}
        </button>
      </form>

      <!-- Fitur Testing / Quick Fill -->
      <div class="mt-8 pt-6 border-t border-slate-100">
        <p class="text-xs text-center font-medium text-slate-400 mb-3 uppercase tracking-wider">
          Mode Presentasi (Isi Otomatis)
        </p>
        <div class="flex flex-col gap-2">
          <button
            type="button"
            @click="fillCredentials('maker')"
            class="py-2 px-4 bg-slate-50 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Isi otomatis sbg Bendahara
          </button>
          <button
            type="button"
            @click="fillCredentials('checker')"
            class="py-2 px-4 bg-slate-50 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Isi otomatis sbg Ketua
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
