import { useQuery } from '@tanstack/react-query'
import { salesApi } from '../../api/sales'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Yakunlangan', color: 'text-green-600 bg-green-50' },
  returned: { label: 'Qaytarilgan', color: 'text-red-600 bg-red-50' },
  partial_return: { label: 'Qisman qaytarilgan', color: 'text-orange-600 bg-orange-50' },
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Naqd', card: 'Karta', click: 'Click', payme: 'Payme', mixed: 'Aralash',
}

export function SalesPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', date],
    queryFn: () => salesApi.getAll(`${date}T00:00:00`, `${date}T23:59:59`),
  })

  const total = sales.reduce((s: number, sale: any) => s + Number(sale.total), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sotuvlar</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <span className="text-blue-700 font-medium">Jami tushum ({sales.length} sotuv)</span>
        <span className="text-blue-800 font-bold text-xl">
          {total.toLocaleString()} so'm
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Bugun sotuv yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Chek №</th>
                <th className="px-4 py-3">Kassir</th>
                <th className="px-4 py-3">Mijoz</th>
                <th className="px-4 py-3">To'lov turi</th>
                <th className="px-4 py-3 text-right">Summa</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale: any) => {
                const st = STATUS_LABELS[sale.status] || { label: sale.status, color: '' }
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{sale.receiptNo}</td>
                    <td className="px-4 py-3">{sale.cashier?.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{sale.customer?.name || '—'}</td>
                    <td className="px-4 py-3">{PAYMENT_LABELS[sale.paymentType]}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {Number(sale.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(sale.createdAt).toLocaleTimeString('uz-UZ')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
