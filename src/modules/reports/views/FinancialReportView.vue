<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import { reportService } from '../../../core/api/reportService'
import { useAuthStore } from '../../auth/stores/auth'
import type { FinancialReportData, ReportPeriod } from '../../../core/types/report'

const auth = useAuthStore()
const selectedPeriod = ref<ReportPeriod>('this_month')
const customStartDate = ref('2026-11-01')
const customEndDate = ref('2026-11-30')
const isLoading = ref(true)
const reportData = ref<FinancialReportData | null>(null)

const fetchReport = async () => {
  isLoading.value = true
  try {
    const data = await reportService.getReportData({
      period: selectedPeriod.value,
      startDate: selectedPeriod.value === 'custom' ? customStartDate.value : undefined,
      endDate: selectedPeriod.value === 'custom' ? customEndDate.value : undefined,
    })
    reportData.value = data
  } catch (error) {
    console.error('Gagal mengambil laporan keuangan:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchReport()
})

watch(selectedPeriod, () => {
  if (selectedPeriod.value !== 'custom') {
    fetchReport()
  }
})

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

// 1. Ekspor CSV
const exportCSV = () => {
  if (!reportData.value) return

  const orgName = auth.user?.organization?.name || 'Organisasi'
  const rows = [
    [`Laporan Keuangan FundLedger - ${orgName}`],
    ['Periode', reportData.value.periodLabel],
    ['Rentang Tanggal', `${reportData.value.startDate} s/d ${reportData.value.endDate}`],
    [''],
    ['RINGKASAN ARUS KAS'],
    ['Saldo Awal', reportData.value.openingBalance],
    ['Total Pemasukan', reportData.value.totalIncome],
    ['Total Pengeluaran', reportData.value.totalExpense],
    ['Arus Kas Bersih (Net)', reportData.value.netCashflow],
    ['Saldo Akhir', reportData.value.closingBalance],
    [''],
    ['REKAPITULASI PEMASUKAN'],
    ['Kategori', 'Nominal (IDR)', 'Jumlah Tx', 'Persentase (%)'],
    ...reportData.value.incomeCategories.map((c) => [c.category, c.total, c.count, `${c.percentage}%`]),
    [''],
    ['REKAPITULASI PENGELUARAN'],
    ['Kategori', 'Nominal (IDR)', 'Jumlah Tx', 'Persentase (%)'],
    ...reportData.value.expenseCategories.map((c) => [c.category, c.total, c.count, `${c.percentage}%`]),
  ]

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `FundLedger_Laporan_${reportData.value.periodLabel.replace(/\s+/g, '_')}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Laporan CSV berhasil diunduh!',
    showConfirmButton: false,
    timer: 2000,
  })
}

// 2. Ekspor Excel / Spreadsheet (.xls XML format)
const exportExcel = () => {
  if (!reportData.value) return

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /></head>
    <body>
      <h2>FundLedger - Laporan Keuangan Organisasi</h2>
      <p>Organisasi: ${auth.user?.organization?.name || 'Organisasi'}</p>
      <p>Periode: ${reportData.value.periodLabel} (${reportData.value.startDate} s/d ${reportData.value.endDate})</p>
      <table border="1">
        <tr style="background:#5B21B6;color:#FFF;"><th>Metrik</th><th>Nilai (IDR)</th></tr>
        <tr><td>Saldo Awal</td><td>${reportData.value.openingBalance}</td></tr>
        <tr><td>Total Pemasukan</td><td>${reportData.value.totalIncome}</td></tr>
        <tr><td>Total Pengeluaran</td><td>${reportData.value.totalExpense}</td></tr>
        <tr><td>Arus Kas Bersih</td><td>${reportData.value.netCashflow}</td></tr>
        <tr><td>Saldo Akhir</td><td>${reportData.value.closingBalance}</td></tr>
      </table>
      <br/>
      <h3>Rekapitulasi Pemasukan</h3>
      <table border="1">
        <tr style="background:#F1F5F9;"><th>Kategori</th><th>Nominal</th><th>Jumlah Transaksi</th><th>Porsi</th></tr>
        ${reportData.value.incomeCategories.map((c) => `<tr><td>${c.category}</td><td>${c.total}</td><td>${c.count}</td><td>${c.percentage}%</td></tr>`).join('')}
      </table>
      <br/>
      <h3>Rekapitulasi Pengeluaran</h3>
      <table border="1">
        <tr style="background:#F1F5F9;"><th>Kategori</th><th>Nominal</th><th>Jumlah Transaksi</th><th>Porsi</th></tr>
        ${reportData.value.expenseCategories.map((c) => `<tr><td>${c.category}</td><td>${c.total}</td><td>${c.count}</td><td>${c.percentage}%</td></tr>`).join('')}
      </table>
    </body></html>
  `

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `FundLedger_Laporan_${reportData.value.periodLabel.replace(/\s+/g, '_')}.xls`
  a.click()
  URL.revokeObjectURL(url)

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Laporan Excel berhasil diunduh!',
    showConfirmButton: false,
    timer: 2000,
  })
}

// 3. Print / Cetak PDF
const printReport = () => {
  window.print()
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header & Action Buttons -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Laporan Keuangan Periodik</h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Rekapitulasi arus kas masuk, pengeluaran kas, serta ekspor dokumen keuangan untuk pelaporan dan audit.
        </p>
      </div>

      <!-- Action Ekspor -->
      <div class="flex flex-wrap gap-2">
        <button
          @click="exportCSV"
          class="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <i class="pi pi-file text-emerald-600"></i> Unduh CSV
        </button>
        <button
          @click="exportExcel"
          class="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <i class="pi pi-file-excel text-emerald-600"></i> Unduh Excel
        </button>
        <button
          @click="printReport"
          class="px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <i class="pi pi-print"></i> Cetak / PDF
        </button>
      </div>
    </div>

    <!-- Filter Periode (Hidden on print) -->
    <div class="bg-surface border border-slate-200 rounded-xl p-4 shadow-sm print:hidden">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Periode:</span>
          <div class="inline-flex p-1 bg-slate-100 rounded-lg text-xs sm:text-sm font-medium">
            <button
              @click="selectedPeriod = 'this_month'"
              :class="[
                'px-3 py-1.5 rounded-md transition-colors',
                selectedPeriod === 'this_month' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              Bulan Ini
            </button>
            <button
              @click="selectedPeriod = 'last_month'"
              :class="[
                'px-3 py-1.5 rounded-md transition-colors',
                selectedPeriod === 'last_month' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              Bulan Lalu
            </button>
            <button
              @click="selectedPeriod = 'this_quarter'"
              :class="[
                'px-3 py-1.5 rounded-md transition-colors',
                selectedPeriod === 'this_quarter' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              Kuartal Ini
            </button>
            <button
              @click="selectedPeriod = 'this_year'"
              :class="[
                'px-3 py-1.5 rounded-md transition-colors',
                selectedPeriod === 'this_year' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              Tahun Ini (YTD)
            </button>
            <button
              @click="selectedPeriod = 'custom'"
              :class="[
                'px-3 py-1.5 rounded-md transition-colors',
                selectedPeriod === 'custom' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              Kustom
            </button>
          </div>
        </div>

        <!-- Custom Date Range Picker -->
        <div v-if="selectedPeriod === 'custom'" class="flex items-center gap-2">
          <input
            type="date"
            v-model="customStartDate"
            class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          />
          <span class="text-slate-400">s/d</span>
          <input
            type="date"
            v-model="customEndDate"
            class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          />
          <button
            @click="fetchReport"
            class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>

    <!-- Print Header (Hanya muncul saat cetak / Print PDF) -->
    <div class="hidden print:block mb-8 border-b-2 border-primary pb-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-primary">FundLedger</h1>
          <p class="text-sm text-slate-600">Sistem Pengelolaan & Transparansi Keuangan Berbasis Blockchain</p>
        </div>
        <div class="text-right text-xs text-slate-500">
          <p class="font-semibold text-slate-800 text-sm">{{ auth.user?.organization?.name || 'Organisasi' }}</p>
          <p>Dicetak: {{ new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }) }}</p>
        </div>
      </div>
      <div class="mt-4 text-sm font-medium text-slate-800">
        Laporan Keuangan Periode: {{ reportData?.periodLabel }} ({{ reportData?.startDate }} s/d {{ reportData?.endDate }})
      </div>
    </div>

    <!-- Kartu Ringkasan Arus Kas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-surface border border-slate-200 p-5 rounded-xl shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Awal Kas</span>
        <div class="text-xl font-semibold text-slate-800 mt-2 tabular-nums">
          {{ formatRupiah(reportData?.openingBalance || 0) }}
        </div>
      </div>

      <div class="bg-surface border border-slate-200 p-5 rounded-xl shadow-sm">
        <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Pemasukan</span>
        <div class="text-xl font-semibold text-emerald-600 mt-2 tabular-nums">
          + {{ formatRupiah(reportData?.totalIncome || 0) }}
        </div>
      </div>

      <div class="bg-surface border border-slate-200 p-5 rounded-xl shadow-sm">
        <span class="text-xs font-semibold text-red-600 uppercase tracking-wider">Total Pengeluaran</span>
        <div class="text-xl font-semibold text-red-600 mt-2 tabular-nums">
          - {{ formatRupiah(reportData?.totalExpense || 0) }}
        </div>
      </div>

      <div class="bg-surface border border-primary/20 bg-purple-50/30 p-5 rounded-xl shadow-sm">
        <span class="text-xs font-semibold text-primary uppercase tracking-wider">Saldo Akhir Kas</span>
        <div class="text-xl font-bold text-primary mt-2 tabular-nums">
          {{ formatRupiah(reportData?.closingBalance || 0) }}
        </div>
      </div>
    </div>

    <!-- Dua Kolom: Rekapitulasi Kategori Pemasukan & Pengeluaran -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Rekap Pemasukan -->
      <div class="bg-surface border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 class="font-semibold text-slate-900 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Rekapitulasi Pemasukan
          </h3>
          <span class="text-xs font-medium text-emerald-600 tabular-nums">
            {{ formatRupiah(reportData?.totalIncome || 0) }}
          </span>
        </div>

        <div class="space-y-4">
          <div
            v-for="cat in reportData?.incomeCategories"
            :key="cat.category"
            class="space-y-1.5"
          >
            <div class="flex justify-between text-xs">
              <span class="font-medium text-slate-700">{{ cat.category }} ({{ cat.count }} tx)</span>
              <span class="font-semibold text-slate-900 tabular-nums">{{ formatRupiah(cat.total) }} ({{ cat.percentage }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                :style="{ width: `${cat.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rekap Pengeluaran -->
      <div class="bg-surface border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 class="font-semibold text-slate-900 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            Rekapitulasi Pengeluaran
          </h3>
          <span class="text-xs font-medium text-red-600 tabular-nums">
            {{ formatRupiah(reportData?.totalExpense || 0) }}
          </span>
        </div>

        <div class="space-y-4">
          <div
            v-for="cat in reportData?.expenseCategories"
            :key="cat.category"
            class="space-y-1.5"
          >
            <div class="flex justify-between text-xs">
              <span class="font-medium text-slate-700">{{ cat.category }} ({{ cat.count }} tx)</span>
              <span class="font-semibold text-slate-900 tabular-nums">{{ formatRupiah(cat.total) }} ({{ cat.percentage }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-red-500 rounded-full transition-all duration-500"
                :style="{ width: `${cat.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
