import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { Plus, Truck } from 'lucide-react'

const suppliersApi = {
  getAll: () => api.get('/suppliers').then((r) => r.data),
  create: (data: any) => api.post('/suppliers', data).then((r) => r.data),
}

export function SuppliersPage() {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', inn: '' })
  const queryClient = useQueryClient()

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setCreating(false)
      setForm({ name: '', phone: '', inn: '' })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yetkazib beruvchilar</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          Yangi yetkazib beruvchi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center">
            <Truck size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Yetkazib beruvchilar yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">INN</th>
                <th className="px-4 py-3 text-right">Balans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.inn || '—'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${Number(s.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(s.balance).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">Yangi yetkazib beruvchi</h2>
            <div className="space-y-3">
              {[
                { name: 'name', label: 'Nomi', placeholder: 'Kompaniya nomi' },
                { name: 'phone', label: 'Telefon', placeholder: '+998901234567' },
                { name: 'inn', label: 'INN', placeholder: '1234567890' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    value={(form as any)[name]}
                    onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => createMutation.mutate(form)}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
              >
                Saqlash
              </button>
              <button
                onClick={() => setCreating(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
