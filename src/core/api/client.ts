import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

// Gunakan /api jika memakai Vite proxy, atau fallback ke env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
})

// Pasang token awal jika sudah ada di localStorage saat reload browser
const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`
}

// Request Interceptor: Memastikan Auth Token selalu terpasang di headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`)
      } else if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor: Penanganan 401 Unauthorized yang aman & terisolasi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. JANGAN PERNAH redirect jika error 401 berasal dari endpoint /login!
    // Biarkan form login menampilkan alert "Email atau kata sandi salah"
    if (error.config?.url?.includes('/login')) {
      return Promise.reject(error)
    }

    // 2. Jika user sengaja memakai token mock (mode simulasi), jangan logout paksa
    const currentToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    if (currentToken && currentToken.startsWith('mock-')) {
      return Promise.reject(error)
    }

    // 3. Jika sesi token nyata dari Laravel Sanctum benar-benar hangus (401)
    if (error.response?.status === 401) {
      console.warn('🔒 Token Sanctum tidak valid atau sesi berakhir (401). Mengalihkan ke login...')
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      delete apiClient.defaults.headers.common['Authorization']

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
