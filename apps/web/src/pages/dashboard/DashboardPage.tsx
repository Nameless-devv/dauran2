import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../api/reports'
import { stockApi } from '../../api/stock'
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

export function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  const { data: daily } = useQuery({
    queryKey: ['reports', 'daily', today],
    queryFn: () => reportsApi.daily(today),
  })

  const { data: monthly } = useQuery({
    queryKey: ['reports', 'monthly', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => reportsApi.monthly(now.getFullYear(), now.getMonth() + 1),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['stock', 'low'],
    queryFn: stockApi.getLow,
  })

  const revenue = daily?.summary?.revenue || 0
  const salesCount = daily?.summary?.total_sales || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Bugungi tushum"
          value={`${Number(revenue).toLocaleString()} so'm`}
          color="bg-blue-500"
        />
        <StatCard
          icon={ShoppingCart}
          label="Sotuvlar soni"
          value={salesCount}
          color="bg-green-500"
        />
        <StatCard
          icon={Package}
          label="Kam qoldiq"
          value={lowStock?.length || 0}
          color="bg-orange-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Qaytarishlar"
          value={daily?.summary?.returns || 0}
          color="bg-red-500"
        />
      </div>

      {monthly?.dailyRevenue && monthly.dailyRevenue.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Oylik tushum dinamikasi</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) => [`${Number(v).toLocaleString()} so'm`, 'Tushum']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fill="#eff6ff"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {lowStock && lowStock.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Kam qoldiqli mahsulotlar
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Mahsulot</th>
                  <th className="pb-2">Shtrix-kod</th>
                  <th className="pb-2 text-right">Qoldiq</th>
                  <th className="pb-2 text-right">Min. qoldiq</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 10).map((item: any) => (
                  <tr key={item.product_id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2 text-gray-500">{item.barcode}</td>
                    <td className="py-2 text-right text-red-600 font-medium">{item.qty}</td>
                    <td className="py-2 text-right text-gray-500">{item.min_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
