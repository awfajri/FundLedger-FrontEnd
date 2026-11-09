import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const storedUser = localStorage.getItem('user')
  const user = ref<any>(storedUser ? JSON.parse(storedUser) : null)
  const token = ref<string | null>(localStorage.getItem('token') || null)

  // Setup default header Axios jika token sudah ada
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  // ==========================================
  // BUG FIX: AXIOS INTERCEPTOR (SATPAM TOKEN)
  // ==========================================
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Jika backend bilang 401 (Unauthorized / Token Hangus)
      if (error.response && error.response.status === 401) {
        console.warn('🔒 Token tidak valid atau database ter-reset. Mengeluarkan user...')

        // Bersihkan data sampah di browser
        user.value = null
        token.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']

        // Tendang balik ke halaman Login
        router.push('/login')
      }
      return Promise.reject(error)
    },
  )
  // ==========================================

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', credentials)

      token.value = response.data.token
      user.value = response.data.user

      localStorage.setItem('token', token.value!)
      localStorage.setItem('user', JSON.stringify(user.value))

      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      router.push('/')
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Kredensial salah' }
    }
  }

  const logout = async () => {
    try {
      if (token.value) await axios.post('http://127.0.0.1:8000/api/logout')
    } catch (error) {
      console.error('Logout di server gagal, tapi session lokal tetap dihapus.')
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      router.push('/login')
    }
  }

  const isAuthenticated = () => token.value !== null
  const isMaker = () => user.value?.role === 'maker'
  const isChecker = () => user.value?.role === 'checker'

  return { user, token, login, logout, isAuthenticated, isMaker, isChecker }
})
