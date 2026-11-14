<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { organizationService } from '../../../core/api/organizationService'
import { useAuthStore } from '../../auth/stores/auth'
import type { OrganizationDetails, Member } from '../../../core/types/organization'
import type { UserRole } from '../../../core/types/auth'

const auth = useAuthStore()

const orgDetails = ref<OrganizationDetails | null>(null)
const isLoading = ref(true)

// State Modal Tambah Anggota
const isAddMemberModalOpen = ref(false)
const isSubmitting = ref(false)
const newMemberForm = ref({
  name: '',
  email: '',
  role: 'viewer' as UserRole,
  wallet_address: '',
})

const fetchOrganization = async () => {
  isLoading.value = true
  try {
    const data = await organizationService.getOrganizationDetails()
    orgDetails.value = data
  } catch (error) {
    console.error('Gagal mengambil data organisasi:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchOrganization()
})

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Alamat Smart Contract disalin!',
    showConfirmButton: false,
    timer: 2000,
  })
}

const openAddMemberModal = () => {
  newMemberForm.value = {
    name: '',
    email: '',
    role: 'viewer',
    wallet_address: '',
  }
  isAddMemberModalOpen.value = true
}

const handleAddMember = async () => {
  if (!newMemberForm.value.name || !newMemberForm.value.email) {
    Swal.fire('Peringatan', 'Harap isi nama dan email anggota.', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    const res = await organizationService.addMember({
      name: newMemberForm.value.name,
      email: newMemberForm.value.email,
      role: newMemberForm.value.role,
      wallet_address: newMemberForm.value.wallet_address || undefined,
    })

    if (res.success && res.member && orgDetails.value) {
      orgDetails.value.members.push(res.member)
      orgDetails.value.members_count = orgDetails.value.members.length

      Swal.fire({
        title: 'Anggota Ditambahkan!',
        text: `${res.member.name} berhasil ditugaskan sebagai ${res.member.role.toUpperCase()}.`,
        icon: 'success',
        confirmButtonColor: '#5B21B6',
      })
      isAddMemberModalOpen.value = false
    }
  } catch (error: any) {
    Swal.fire('Gagal', error.message || 'Error server.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const getRoleBadgeClass = (role: UserRole) => {
  switch (role) {
    case 'checker':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'maker':
      return 'bg-purple-100 text-primary border-purple-200'
    case 'viewer':
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'checker':
      return 'Ketua (Checker)'
    case 'maker':
      return 'Bendahara (Maker)'
    case 'viewer':
      return 'Anggota (Viewer)'
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header Halaman -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Profil Organisasi & Manajemen Anggota</h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Informasi legalitas entitas organisasi, status smart contract blockchain, dan pembagian hak akses anggota.
        </p>
      </div>

      <!-- Tombol Tambah Anggota (Khusus Ketua / Checker) -->
      <button
        v-if="auth.isChecker()"
        @click="openAddMemberModal"
        class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
      >
        <i class="pi pi-user-plus"></i> Tambah Anggota
      </button>
    </div>

    <!-- Kartu Entitas Organisasi -->
    <div class="bg-surface border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-semibold text-primary uppercase tracking-wider">Entitas Terdaftar</span>
          <h3 class="text-xl font-bold text-slate-900 mt-0.5">
            {{ orgDetails?.name || auth.user?.organization?.name || 'Organisasi' }}
          </h3>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-500">Saldo Kas Organisasi:</span>
          <div class="text-2xl font-bold text-primary tabular-nums">
            {{ formatRupiah(orgDetails?.balance ?? auth.user?.organization?.balance ?? 0) }}
          </div>
        </div>
      </div>

      <!-- Detail On-Chain Smart Contract -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <span class="text-slate-500 block mb-1">Smart Contract Proxy Address:</span>
          <div v-if="orgDetails?.smart_contract_address" class="flex items-center justify-between font-mono font-medium text-slate-800">
            <span class="truncate mr-2">{{ orgDetails.smart_contract_address }}</span>
            <button
              @click="copyToClipboard(orgDetails.smart_contract_address)"
              class="text-primary hover:text-primary/80"
              title="Salin Alamat"
            >
              <i class="pi pi-copy"></i>
            </button>
          </div>
          <div v-else class="text-amber-700 font-medium flex items-center gap-1.5 mt-1">
            <i class="pi pi-clock text-[11px]"></i>
            <span>Belum Dideploy (Menunggu Setup)</span>
          </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <span class="text-slate-500 block mb-1">Jaringan Blockchain:</span>
          <div class="font-medium text-slate-800 flex items-center gap-1.5">
            <span
              class="w-2 h-2 rounded-full"
              :class="orgDetails?.smart_contract_address ? 'bg-emerald-500' : 'bg-amber-500'"
            ></span>
            {{ orgDetails?.network || 'Lokal EVM / Hardhat (Tahap Setup)' }}
          </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <span class="text-slate-500 block mb-1">Total Anggota Terdaftar:</span>
          <div class="font-bold text-slate-800 text-sm">
            {{ orgDetails?.members_count || orgDetails?.members?.length || 0 }} Anggota
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel Daftar Anggota & Peran (RBAC) -->
    <div class="bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 class="font-semibold text-slate-900 text-base">Daftar Anggota & Wewenang Akses</h3>
          <p class="text-xs text-slate-500">Pembagian tugas sesuai peran: Bendahara (Maker), Ketua (Checker), dan Anggota (Viewer).</p>
        </div>
        <span class="text-xs bg-slate-100 px-2.5 py-1 rounded-full font-medium text-slate-600">
          {{ orgDetails?.members.length || 0 }} Anggota
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th class="px-6 py-3.5">Nama & Email</th>
              <th class="px-6 py-3.5">Peran (Role)</th>
              <th class="px-6 py-3.5">Wallet Address</th>
              <th class="px-6 py-3.5">Bergabung</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="member in orgDetails?.members"
              :key="member.id"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ member.name }}</div>
                <div class="text-xs text-slate-500">{{ member.email }}</div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                    getRoleBadgeClass(member.role),
                  ]"
                >
                  {{ getRoleLabel(member.role) }}
                </span>
              </td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">
                {{ member.wallet_address || '-' }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {{ member.joined_at }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Tambah Anggota -->
    <div
      v-if="isAddMemberModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Tambah Anggota Organisasi</h3>
            <p class="text-xs text-slate-500">Tentukan wewenang peran sesuai struktur organisasi.</p>
          </div>
          <button @click="isAddMemberModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <i class="pi pi-times text-lg"></i>
          </button>
        </div>

        <form @submit.prevent="handleAddMember" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
            <input
              v-model="newMemberForm.name"
              type="text"
              required
              placeholder="Contoh: Ahmad Fauzi"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Email <span class="text-red-500">*</span></label>
            <input
              v-model="newMemberForm.email"
              type="email"
              required
              placeholder="ahmad@sastramesin.org"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Penugasan Peran (RBAC) <span class="text-red-500">*</span></label>
            <select
              v-model="newMemberForm.role"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="viewer">Anggota (Viewer - Read Only)</option>
              <option value="maker">Bendahara (Maker - Inisiator Transaksi)</option>
              <option value="checker">Ketua (Checker - Otorisator Transaksi)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Wallet Address (Opsional)</label>
            <input
              v-model="newMemberForm.wallet_address"
              type="text"
              placeholder="0x..."
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="isAddMemberModalOpen = false"
              class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <i v-if="isSubmitting" class="pi pi-spinner animate-spin"></i>
              Simpan Anggota
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
