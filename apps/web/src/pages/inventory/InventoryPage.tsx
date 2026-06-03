import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../api/inventory'
import { useState } from 'react'
import { ClipboardList, Play, CheckCircle, ChevronRight, AlertTriangle } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  in_progress: 'Davom etmoqda',
  completed: 'Yakunlangan',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
}

export function InventoryPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [showStart, setShowStart] = useState(false)
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})

  const { data: inventories = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  })

  const { data: active } = useQuery({
    queryKey: ['inventory', 'active'],
    queryFn: inventoryApi.getActive,
    refetchInterval: selectedId ? false : 10_000,
  })

  const { data: detail } = useQuery({
    queryKey: ['inventory', selectedId],
    queryFn: () => inventoryApi.getOne(selectedId!),
    enabled: !!selectedId,
  })

  const startMut = useMutation({
    mutationFn: () => inventoryApi.start(note || undefined),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setShowStart(false)
      setNote('')
      setSelectedId(inv.id)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      inventoryApi.updateQty(selectedId!, productId, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', selectedId] })
    },
  })

  const completeMut = useMutation({
    mutationFn: () => inventoryApi.complete(selectedId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setSelectedId(null)
    },
  })

  const handleQtyBlur = (productId: string) => {
    const raw = qtyInputs[productId]
    if (raw === undefined || raw === '') return
    const qty = Number(raw)
    if (isNaN(qty) || qty < 0) return
    updateMut.mutate({ productId, qty })
  }

  const viewData = detail ?? (active && active?.id === selectedId ? active : null)
  const items = viewData?.items ?? []
  const isActive = viewData?.status === 'in_progress'
  const filledCount = items.filter((i: any) => i.actualQty !== null && i.actualQty !== undefined).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventarizatsiya (Revizya)</h1>
        {!active && (
          <button
            onClick={() => setShowStart(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Play size={16} />
            Yangi revizya boshlash
          </button>
        )}
      </div>

      {/* Start modal */}
      {showStart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-800 mb-4">Yangi revizya boshlash</h2>
            <input
              type="text"
              placeholder="Izoh (ixtiyoriy)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => startMut.mutate()}
                disabled={startMut.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {startMut.isPending ? 'Yuklanmoqda...' : 'Boshlash'}
              </button>
              <button
                onClick={() => setShowStart(false)}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active banner */}
      {active && !selectedId && (
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-yellow-100"
          onClick={() => setSelectedId(active.id)}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600" />
            <div>
              <div className="font-semibold text-yellow-800 text-sm">Faol revizya mavjud</div>
              <div className="text-xs text-yellow-600">
                Boshlangan: {new Date(active.createdAt).toLocaleString('uz-UZ')}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-yellow-600" />
        </div>
      )}

      {/* Detail view */}
      {selectedId && viewData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-gray-500" />
                <span className="font-semibold text-gray-800">
                  Revizya #{viewData.id.slice(0, 8)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[viewData.status]}`}>
                  {STATUS_LABEL[viewData.status]}
                </span>
              </div>
              {viewData.note && <div className="text-xs text-gray-500 mt-1">{viewData.note}</div>}
              <div className="text-xs text-gray-400 mt-0.5">
                {filledCount}/{items.length} mahsulot kiritildi
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <button
                  onClick={() => {
                    if (confirm('Revizyani yakunlashni tasdiqlaysizmi? Farqlar omborga qo\'llanadi.')) {
                      completeMut.mutate()
                    }
                  }}
                  disabled={completeMut.isPending}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {completeMut.isPending ? 'Yakunlanmoqda...' : 'Yakunlash'}
                </button>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Ortga
              </button>
            </div>
          </div>

          {viewData.status === 'completed' && viewData.totalDifference !== undefined && (
            <div className={`mx-5 mt-4 p-3 rounded-lg text-sm font-medium ${
              viewData.totalDifference >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              Jami farq: {Number(viewData.totalDifference).toLocaleString()} so'm
              {viewData.totalDifference < 0 && ' (kamomad)'}
              {viewData.totalDifference > 0 && ' (ortiqcha)'}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50">
                  <th className="px-5 py-3 font-medium">Mahsulot</th>
                  <th className="px-5 py-3 font-medium text-right">Tizim (dona)</th>
                  <th className="px-5 py-3 font-medium text-right">Haqiqiy (dona)</th>
                  <th className="px-5 py-3 font-medium text-right">Farq</th>
                  {isActive && <th className="px-5 py-3 font-medium">Kiritish</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const diff = item.actualQty !== null && item.actualQty !== undefined
                    ? Number(item.actualQty) - Number(item.systemQty)
                    : null
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {item.product?.name}
                        {item.note && <div className="text-xs text-gray-400">{item.note}</div>}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {Number(item.systemQty).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.actualQty !== null && item.actualQty !== undefined
                          ? <span className="font-medium">{Number(item.actualQty).toLocaleString()}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-right">
                        {diff !== null ? (
                          <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      {isActive && (
                        <td className="px-5 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            placeholder={String(item.systemQty)}
                            value={qtyInputs[item.product?.id] ?? (item.actualQty !== null && item.actualQty !== undefined ? String(item.actualQty) : '')}
                            onChange={(e) => setQtyInputs((prev) => ({ ...prev, [item.product?.id]: e.target.value }))}
                            onBlur={() => handleQtyBlur(item.product?.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleQtyBlur(item.product?.id) }}
                            className="w-28 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History list */}
      {!selectedId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Revizya tarixi</h2>
          </div>
          {inventories.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Hali revizya o'tkazilmagan</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {inventories.map((inv: any) => (
                <div
                  key={inv.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedId(inv.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        #{inv.id.slice(0, 8)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[inv.status]}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(inv.createdAt).toLocaleString('uz-UZ')}
                      {inv.createdBy && ` · ${inv.createdBy.fullName}`}
                      {inv.note && ` · ${inv.note}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.totalDifference !== null && inv.totalDifference !== undefined && (
                      <span className={`text-sm font-medium ${inv.totalDifference < 0 ? 'text-red-600' : inv.totalDifference > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {inv.totalDifference > 0 ? '+' : ''}{Number(inv.totalDifference).toLocaleString()} so'm
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
