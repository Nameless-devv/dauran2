import { useQuery } from '@tanstack/react-query'
import { stockApi } from '../../api/stock'
import { Warehouse, AlertTriangle } from 'lucide-react'

export function StockPage() {
  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: stockApi.getAll,
  })

  const lowCount = stock.filter((s: any) => Number(s.qty) <= Number(s.minQty)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ombor qoldiqlari</h1>
        {lowCount > 0 && (
          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-sm">
            <AlertTriangle size={16} />
            {lowCount} ta mahsulot kam qoldiqda
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>
        ) : stock.length === 0 ? (
          <div className="p-8 text-center">
            <Warehouse size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Ombor bo'sh</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Shtrix-kod</th>
                <th className="px-4 py-3">Kategoriya</th>
                <th className="px-4 py-3 text-right">Qoldiq</th>
                <th className="px-4 py-3 text-right">Min. qoldiq</th>
                <th className="px-4 py-3 text-right">Sotuv narxi</th>
                <th className="px-4 py-3 text-right">Ombor qiymati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stock.map((s: any) => {
                const isLow = Number(s.qty) <= Number(s.minQty)
                const value = Number(s.qty) * Number(s.product?.costPrice || 0)
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 ${isLow ? 'bg-orange-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium">{s.product?.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.product?.barcode}</td>
                    <td className="px-4 py-3 text-gray-500">{s.product?.category?.name || '—'}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                      {Number(s.qty).toFixed(s.product?.unit === 'kg' ? 3 : 0)}
                      <span className="text-xs text-gray-400 ml-1">{s.product?.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{s.minQty}</td>
                    <td className="px-4 py-3 text-right">{Number(s.product?.salePrice || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{value.toLocaleString()}</td>
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
