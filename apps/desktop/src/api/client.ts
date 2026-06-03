import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

export function createApiClient(serverUrl: string, accessToken: string | null) {
  const client = axios.create({
    baseURL: serverUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 5000,
  })

  client.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        useAuthStore.getState().logout()
      }
      return Promise.reject(err)
    }
  )

  return client
}
