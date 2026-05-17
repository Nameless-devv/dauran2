import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../api/reports'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const ABC_COLORS: Record<string, string> = { A: '#22c55e', B: '#3b82f6', C: '#ef4444' }

export function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: monthly, isLoading } = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () => reportsApi.monthly(year, month),
  })

  const { data: abc } = useQuery({
    queryKey: ['reports', 'abc'],
    queryFn: reportsApi.abc,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hisobotlar</h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('uz-UZ', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {!isLoading && monthly?.dailyRevenue && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Kunlik tushum</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`${Number(v).toLocaleString()} so'm`, 'Tushum']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {abc && abc.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">ABC tahlil (so'nggi 30 kun)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Mahsulot</th>
                  <th className="pb-2 text-right">Daromad</th>
                  <th className="pb-2 text-right">Kumulyativ %</th>
                  <th className="pb-2 text-center">Sinf</th>
                </tr>
              </thead>
              <tbody>
                {abc.slice(0, 30).map((item: any, i: number) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-400">{item.rank}</td>
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2 text-right">{Number(item.revenue).toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-500">
                      {Number(item.cumulative_pct).toFixed(1)}%
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ background: ABC_COLORS[item.abc_class] }}
                      >
                        {item.abc_class}
                      </span>
                    </td>
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
