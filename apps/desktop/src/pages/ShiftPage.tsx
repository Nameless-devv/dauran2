import { useState } from 'react'
import { Clock, DollarSign, LogIn, LogOut } from 'lucide-react'
import { usePosStore } from '../store/pos.store'
import { useAuthStore } from '../store/auth.store'
import { createApiClient } from '../api/client'

export function ShiftPage({ onShiftOpen }: { onShiftOpen: () => void }) {
  const [openingCash, setOpeningCash] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { shiftId, shiftOpened, setShift, cashierName } = usePosStore()
  const { accessToken, serverUrl } = useAuthStore()

  const api = createApiClient(serverUrl, accessToken)

  const openShift = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/shifts/open', { openingCash })
      setShift(data.id, true)
      onShiftOpen()
    } catch (e: any) {
      const msg = e.response?.data?.message
      if (typeof msg === 'string') setError(msg)
      else setError('Smena ochishda xato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="text-blue-400" size={28} />
          <div>
            <h2 className="text-xl font-bold text-white">Smena ochish</h2>
            <p className="text-sm text-gray-400">{cashierName}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-2">
            Boshlang'ich naqd pul (so'm)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              inputMode="numeric"
              value={openingCash === 0 ? '' : openingCash.toLocaleString('uz-UZ')}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setOpeningCash(raw === '' ? 0 : parseInt(raw, 10))
              }}
              placeholder="0"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tez tugmalar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[0, 100000, 200000, 500000, 1000000, 2000000].map((v) => (
            <button
              key={v}
              onClick={() => setOpeningCash(v)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                openingCash === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {v === 0 ? '0' : `${(v / 1000).toFixed(0)}K`}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        <button
          onClick={openShift}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          <LogIn size={20} />
          {loading ? 'Ochilmoqda...' : 'Smenani ochish'}
        </button>
      </div>
    </div>
  )
}
