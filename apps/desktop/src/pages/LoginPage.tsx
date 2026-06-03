import { useState } from 'react'
import { Store, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { usePosStore } from '../store/pos.store'

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000/api/v1')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const { setCashier } = usePosStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(serverUrl, username, password)
      const user = useAuthStore.getState().user!
      setCashier(user.id, user.fullName)
      onLogin()
    } catch {
      setError('Login yoki parol noto\'g\'ri, yoki server bilan aloqa yo\'q')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm border border-gray-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 rounded-xl p-3">
            <Store className="text-white" size={28} />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-white">Dauran POS</h1>
            <p className="text-xs text-gray-400">Kassa tizimi</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Server manzili</label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="http://localhost:3000/api/v1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Foydalanuvchi nomi</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="kassir"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  )
}
