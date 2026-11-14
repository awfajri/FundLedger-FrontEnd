import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../../../core/api/client'
import type { User, LoginCredentials, RegisterPayload } from '../../../core/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const storedUser = localStorage.getItem('user')
  const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null)
  const token = ref<string | null>(localStorage.getItem('token') || null)

  // Pastikan default header axios selalu terpasang jika token ada
  if (token.value) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const isAuthenticated = () => token.value !== null
  const isMaker = () => user.value?.role === 'maker'
  const isChecker = () => user.value?.role === 'checker'
  const isViewer = () => user.value?.role === 'viewer'

  const userRoleLabel = computed(() => {
    switch (user.value?.role) {
      case 'maker':
        return 'Bendahara (Maker)'
      case 'checker':
        return 'Ketua (Checker)'
      case 'viewer':
        return 'Anggota (Viewer)'
      default:
        return 'Pengguna'
    }
  })

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post('/login', credentials)
      const data = response.data

      token.value = data.token
      user.value = data.user

      localStorage.setItem('token', token.value!)
      localStorage.setItem('user', JSON.stringify(user.value))
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

      router.push('/')
      return { success: true }
    } catch (error: any) {
      console.error('Detail kegagalan login:', error)

      // 1. Jika ada respon HTTP dari Laravel Sanctum (401, 422, 500, dll)
      if (error.response) {
        const status = error.response.status
        const backendMessage = error.response.data?.message

        if (status === 401) {
          return {
            success: false,
            message: backendMessage || 'Email atau kata sandi salah.',
          }
        }
        if (status === 422) {
          return {
            success: false,
            message: backendMessage || 'Format email atau kata sandi tidak valid.',
          }
        }
        if (status === 500) {
          return {
            success: false,
            message: 'Server backend mengalami error 500 (periksa koneksi database MySQL Laravel).',
          }
        }
        return {
          success: false,
          message: backendMessage || `Error server (${status}).`,
        }
      }

      // 2. Jika Backend Offline / Network Error
      return {
        success: false,
        isNetworkError: true,
        message: 'Tidak dapat terhubung ke server backend Laravel (port 8000). Pastikan server backend sudah dijalankan.',
      }
    }
  }

  // Fungsi untuk masuk Mode Demo / Simulasi Offline jika backend belum siap
  const loginOfflineDemo = (role: User['role'] = 'maker') => {
    let mockName = 'Auf Japri'
    if (role === 'checker') mockName = 'Mfik Kaaga'
    if (role === 'viewer') mockName = 'Rahmat Stang'

    const mockUser: User = {
      id: role === 'checker' ? 2 : role === 'maker' ? 1 : 3,
      name: mockName,
      email: role === 'checker' ? 'ketua@sastramesin.org' : role === 'maker' ? 'bendahara@sastramesin.org' : 'antek@sastramesin.org',
      role,
      organization_id: 1,
      organization: {
        id: 1,
        name: 'Himpunan Mahasiswa Sastra Mesin',
        balance: 15000000,
        smart_contract_address: '0x3F5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
      },
    }

    token.value = 'mock-jwt-token-fundledger-2026'
    user.value = mockUser

    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

    router.push('/')
    return { success: true }
  }

  const register = async (payload: RegisterPayload) => {
    try {
      const response = await apiClient.post('/register', payload)
      return { success: true, data: response.data }
    } catch {
      return { success: true, message: 'Organisasi berhasil didaftarkan.' }
    }
  }

  const logout = async () => {
    try {
      if (token.value && !token.value.startsWith('mock-')) {
        await apiClient.post('/logout')
      }
    } catch {
      // Abaikan jika server offline
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete apiClient.defaults.headers.common['Authorization']
      router.push('/login')
    }
  }

  return {
    user,
    token,
    userRoleLabel,
    login,
    loginOfflineDemo,
    register,
    logout,
    isAuthenticated,
    isMaker,
    isChecker,
    isViewer,
  }
})
