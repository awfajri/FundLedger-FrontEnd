<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Sidebar Desktop -->
    <aside class="w-64 bg-surface border-r border-slate-200 hidden md:flex flex-col">
      <div class="p-6 border-b border-slate-100">
        <h2 class="text-2xl font-bold text-primary tracking-tight">FundLedger</h2>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2">
        <RouterLink
          to="/"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-primary bg-primary/10 transition-colors font-medium"
        >
          <i class="pi pi-home"></i>
          <span>Dashboard</span>
        </RouterLink>

        <!-- Menu Cash In (Hanya Aktif untuk Maker/Bendahara) -->
        <div
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
            auth.isMaker()
              ? 'text-slate-700 hover:bg-slate-50 cursor-pointer'
              : 'text-slate-400 cursor-not-allowed opacity-60',
          ]"
        >
          <i class="pi pi-wallet"></i>
          <span>Cash In</span>
        </div>

        <!-- Menu Cash Out (Hanya Aktif untuk Maker/Bendahara) -->
        <div
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
            auth.isMaker()
              ? 'text-slate-700 hover:bg-slate-50 cursor-pointer'
              : 'text-slate-400 cursor-not-allowed opacity-60',
          ]"
        >
          <i class="pi pi-send"></i>
          <span>Cash Out</span>
        </div>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header
        class="h-16 bg-surface border-b border-slate-200 flex items-center px-8 justify-between"
      >
        <h1 class="font-semibold text-lg text-slate-800">Organisasi Himtika</h1>

        <!-- User Profile Data Bound to Pinia -->
        <div class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-semibold text-slate-900 leading-none">{{ auth.user.name }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ auth.user.roleLabel }}</p>
          </div>
          <div
            class="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm"
          >
            {{ auth.user.initials }}
          </div>
        </div>
      </header>

      <!-- Scrollable Page Content -->
      <div class="flex-1 overflow-y-auto p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
