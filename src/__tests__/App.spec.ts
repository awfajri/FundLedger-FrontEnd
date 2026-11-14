import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../modules/auth/stores/auth'

// Mock localStorage for Node test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock useRouter
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    path: '/',
  }),
}))

// Mock apiClient
vi.mock('../core/api/client', () => {
  return {
    default: {
      defaults: { headers: { common: {} } },
      post: vi.fn((url: string, data: any) => {
        if (url === '/login') {
          let role = 'maker'
          let name = 'Auf Japri'
          if (data.email.includes('ketua')) {
            role = 'checker'
            name = 'Mfik Kaaga'
          } else if (data.email.includes('antek') || data.email.includes('anggota')) {
            role = 'viewer'
            name = 'Rahmat Stang'
          }

          return Promise.resolve({
            data: {
              token: 'test-token-123',
              user: {
                id: 1,
                name,
                email: data.email,
                role,
                organization_id: 1,
                organization: { id: 1, name: 'Himpunan Mahasiswa Sastra Mesin', balance: 15000 },
              },
            },
          })
        }
        return Promise.resolve({ data: {} })
      }),
      get: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
    apiClient: {
      defaults: { headers: { common: {} } },
      post: vi.fn((url: string, data: any) => {
        if (url === '/login') {
          let role = 'maker'
          let name = 'Auf Japri'
          if (data.email.includes('ketua')) {
            role = 'checker'
            name = 'Mfik Kaaga'
          } else if (data.email.includes('antek') || data.email.includes('anggota')) {
            role = 'viewer'
            name = 'Rahmat Stang'
          }

          return Promise.resolve({
            data: {
              token: 'test-token-123',
              user: {
                id: 1,
                name,
                email: data.email,
                role,
                organization_id: 1,
                organization: { id: 1, name: 'Himpunan Mahasiswa Sastra Mesin', balance: 15000 },
              },
            },
          })
        }
        return Promise.resolve({ data: {} })
      }),
      get: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  }
})

describe('Auth Store & RBAC Management', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initializes with unauthenticated state', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated()).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('correctly sets role flags for Bendahara (Maker)', async () => {
    const auth = useAuthStore()
    const res = await auth.login({ email: 'bendahara@sastramesin.org', password: 'password123' })

    expect(res.success).toBe(true)
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.isMaker()).toBe(true)
    expect(auth.isChecker()).toBe(false)
    expect(auth.isViewer()).toBe(false)
    expect(auth.userRoleLabel).toBe('Bendahara (Maker)')
  })

  it('correctly sets role flags for Ketua (Checker)', async () => {
    const auth = useAuthStore()
    const res = await auth.login({ email: 'ketua@sastramesin.org', password: 'password123' })

    expect(res.success).toBe(true)
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.isMaker()).toBe(false)
    expect(auth.isChecker()).toBe(true)
    expect(auth.isViewer()).toBe(false)
    expect(auth.userRoleLabel).toBe('Ketua (Checker)')
  })

  it('correctly sets role flags for Anggota (Viewer)', async () => {
    const auth = useAuthStore()
    const res = await auth.login({ email: 'antek@sastramesin.org', password: 'password123' })

    expect(res.success).toBe(true)
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.isMaker()).toBe(false)
    expect(auth.isChecker()).toBe(false)
    expect(auth.isViewer()).toBe(true)
    expect(auth.userRoleLabel).toBe('Anggota (Viewer)')
  })

  it('clears state on logout', async () => {
    const auth = useAuthStore()
    await auth.login({ email: 'bendahara@sastramesin.org', password: 'password123' })
    expect(auth.isAuthenticated()).toBe(true)

    await auth.logout()
    expect(auth.isAuthenticated()).toBe(false)
    expect(auth.user).toBeNull()
    expect(auth.token).toBeNull()
  })
})
