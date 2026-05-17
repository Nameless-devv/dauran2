import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '../../api/products'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'

function ProductForm({ product, categories, onSave, onCancel }: any) {
  const [form, setForm] = useState(product || {
    barcode: '', sku: '', name: '', brand: '',
    categoryId: '', unit: 'pcs', costPrice: 0,
    salePrice: 0, isWeighable: false, vatRate: 12,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
        : type === 'number' ? Number(value) : value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
        <h2 className="font-bold text-lg mb-4">
          {product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'barcode', label: 'Shtrix-kod', type: 'text' },
            { name: 'sku', label: 'SKU', type: 'text' },
            { name: 'name', label: 'Nomi', type: 'text', full: true },
            { name: 'brand', label: 'Brend', type: 'text' },
            { name: 'costPrice', label: 'Kirim narxi', type: 'number' },
            { name: 'salePrice', label: 'Sotuv narxi', type: 'number' },
            { name: 'vatRate', label: 'QQS %', type: 'number' },
          ].map(({ name, label, type, full }) => (
            <div key={name} className={full ? 'col-span-2' : ''}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-gray-500 mb-1">O'lchov birligi</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['pcs', 'kg', 'g', 'l', 'ml'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Kategoriya</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Kategoriyasiz —</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              name="isWeighable"
              checked={form.isWeighable}
              onChange={handleChange}
              id="weighable"
              className="rounded"
            />
            <label htmlFor="weighable" className="text-sm text-gray-700">
              Vaznli mahsulot (tarozi orqali)
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onSave(form)}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
          >
            Saqlash
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50"
          >
            Bekor
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll(search || undefined),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setCreating(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          Yangi mahsulot
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mahsulot qidirish..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Shtrix-kod</th>
                <th className="px-4 py-3">Kategoriya</th>
                <th className="px-4 py-3 text-right">Sotuv narxi</th>
                <th className="px-4 py-3 text-right">Birligi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.barcode}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {Number(p.salePrice).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditing(p)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('O\'chirishni tasdiqlaysizmi?'))
                            deleteMutation.mutate(p.id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <ProductForm
          categories={categories}
          onSave={(data: any) => createMutation.mutate(data)}
          onCancel={() => setCreating(false)}
        />
      )}

      {editing && (
        <ProductForm
          product={editing}
          categories={categories}
          onSave={(data: any) => updateMutation.mutate({ id: editing.id, data })}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
