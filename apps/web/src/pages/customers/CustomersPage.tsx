import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { Plus, Search, Users } from 'lucide-react'

const customersApi = {
  getAll: () => api.get('/customers').then((r) => r.data),
  create: (data: any) => api.post('/customers', data).then((r) => r.data),
}

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ phone: '', name: '', birthdate: '' })
  const queryClient = useQueryClient()

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setCreating(false)
      setForm({ phone: '', name: '', birthdate: '' })
    },
  })

  const filtered = customers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mijozlar</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          Yangi mijoz
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Mijozlar topilmadi</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Ism</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3 text-right">Bonus balans</th>
                <th className="px-4 py-3">Ro'yxatga olingan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-4 py-3 capitalize">{c.segment}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {Number(c.bonusBalance).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('uz-UZ')}
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
            <h2 className="font-bold text-lg mb-4">Yangi mijoz</h2>
            <div className="space-y-3">
              {[
                { name: 'phone', label: 'Telefon', type: 'tel', placeholder: '+998901234567' },
                { name: 'name', label: 'Ism', type: 'text', placeholder: 'Ism Familiya' },
                { name: 'birthdate', label: 'Tug\'ilgan kun', type: 'date', placeholder: '' },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type={type}
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
