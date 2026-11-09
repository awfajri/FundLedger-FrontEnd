import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Sementara di-hardcode untuk simulasi, nanti diisi dari response Login API
  const user = ref({
    name: 'Auf Fajri',
    initials: 'AF',
    role: 'checker', // 'maker' = Bendahara, 'checker' = Ketua, 'viewer' = Anggota
    roleLabel: 'Ketua (Checker)',
  })

  // Fungsi untuk ngecek hak akses (Role-Based Access Control)
  const isMaker = () => user.value.role === 'maker'
  const isChecker = () => user.value.role === 'checker'

  return { user, isMaker, isChecker }
})
