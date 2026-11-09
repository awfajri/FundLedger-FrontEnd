<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainLayout from './core/layout/MainLayout.vue'
import { useAuthStore } from './modules/auth/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <!-- Jika sudah login, bungkus halaman dengan Sidebar & Topbar -->
  <MainLayout v-if="auth.isAuthenticated()">
    <RouterView />
  </MainLayout>

  <!-- Jika belum login (di halaman /login), tampilkan komponen telanjang -->
  <RouterView v-else />
</template>
