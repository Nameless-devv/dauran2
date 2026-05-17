import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/client'

interface User {
  id: string
  username: string
  fullName: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      login: async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password })
        localStorage.setItem('access_token', data.accessToken)
        set({ user: data.user, accessToken: data.accessToken })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, accessToken: null })
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
)
