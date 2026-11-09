<script setup lang="ts">
import Card from 'primevue/card'
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <h2 class="text-2xl font-semibold text-slate-900">Ringkasan Keuangan</h2>

    <!-- Grid Metrik -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card Total Saldo -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-sm font-medium text-slate-500">Total Saldo (On-Chain)</div>
        </template>
        <template #content>
          <div class="text-3xl font-semibold text-primary tabular-nums mt-2">Rp 15.450.000</div>
        </template>
      </Card>

      <!-- Card Pemasukan -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-sm font-medium text-slate-500">Pemasukan Bulan Ini</div>
        </template>
        <template #content>
          <div class="text-2xl font-medium text-slate-800 tabular-nums mt-2">+ Rp 3.200.000</div>
        </template>
      </Card>

      <!-- Card Pengeluaran -->
      <Card class="shadow-sm border border-slate-200">
        <template #title>
          <div class="text-sm font-medium text-slate-500">Pengajuan Menunggu</div>
        </template>
        <template #content>
          <div
            class="text-2xl font-medium text-orange-600 tabular-nums mt-2 flex items-center gap-2"
          >
            <i class="pi pi-clock"></i> 2 Transaksi
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabel Transaksi Terbaru -->
    <div class="mt-8 bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-slate-900 text-lg">Transaksi Terbaru (On-Chain)</h3>
        <button class="text-sm text-primary font-medium hover:underline">Lihat Semua</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th class="px-6 py-4 font-medium">ID / Hash</th>
              <th class="px-6 py-4 font-medium">Kategori</th>
              <th class="px-6 py-4 font-medium">Nominal</th>
              <th class="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <!-- Baris 1: Pemasukan (Completed) -->
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-mono text-slate-800">0x8f2a...3b9c</div>
                <div class="text-xs text-slate-400 mt-1">Hari ini, 09:41</div>
              </td>
              <td class="px-6 py-4 text-slate-700">Iuran Anggota Bulan Mei</td>
              <td class="px-6 py-4 text-emerald-600 font-medium tabular-nums">+ Rp 150.000</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
                >
                  <i class="pi pi-check-circle text-[10px]"></i> Selesai
                </span>
              </td>
            </tr>

            <!-- Baris 2: Pengeluaran (Pending Approval) -->
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-mono text-slate-800">Menunggu Hash</div>
                <div class="text-xs text-slate-400 mt-1">Kemarin, 14:20</div>
              </td>
              <td class="px-6 py-4 text-slate-700">Pembelian Server Domain</td>
              <td class="px-6 py-4 text-slate-900 font-medium tabular-nums">Rp 450.000</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
                >
                  <i class="pi pi-clock text-[10px]"></i> Menunggu Persetujuan
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
