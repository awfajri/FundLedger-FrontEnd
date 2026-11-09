import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<any>(null)
  const token = ref<string | null>(localStorage.getItem('token') || null)

  // Setup default header Axios jika token sudah ada di LocalStorage
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // Tembak API Laravel
      const response = await axios.post('http://127.0.0.1:8000/api/login', credentials)

      // Simpan data
      token.value = response.data.token
      user.value = response.data.user

      // Simpan token ke LocalStorage agar tidak hilang saat di-refresh
      localStorage.setItem('token', token.value!)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

      // Arahkan ke Dashboard
      router.push('/')
      return { success: true }
    } catch (error: any) {
      console.error('Login gagal:', error.response?.data?.message)
      return { success: false, message: error.response?.data?.message || 'Terjadi kesalahan' }
    }
  }

  const logout = async () => {
    try {
      // Tembak API Logout Laravel (opsional, untuk menghapus token di server)
      if (token.value) {
        await axios.post('http://127.0.0.1:8000/api/logout')
      }
    } catch (error) {
      console.error('Error saat logout API')
    } finally {
      // Bersihkan state dan LocalStorage
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']

      router.push('/login')
    }
  }

  const isAuthenticated = () => token.value !== null
  const isMaker = () => user.value?.role === 'maker'
  const isChecker = () => user.value?.role === 'checker'

  return { user, token, login, logout, isAuthenticated, isMaker, isChecker }
})
