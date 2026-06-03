import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface AuthState {
  user: { id: string; username: string; fullName: string; role: string } | null
  accessToken: string | null
  serverUrl: string
  login: (serverUrl: string, username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      serverUrl: 'http://localhost:3000/api/v1',

      login: async (serverUrl, username, password) => {
        const { data } = await axios.post(`${serverUrl}/auth/login`, { username, password })
        set({ user: data.user, accessToken: data.accessToken, serverUrl })
      },

      logout: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'pos-auth' }
  )
)
