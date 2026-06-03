import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Trash2, Plus, Minus, ShoppingCart,
  CreditCard, Banknote, Smartphone, Wifi, WifiOff,
  User, Tag, Receipt, RotateCcw, PackageSearch, Camera, Globe, X,
} from 'lucide-react'
import { usePosStore } from '../store/pos.store'
import { useAuthStore } from '../store/auth.store'
import {
  searchProductByBarcode, searchProductsByName,
  getCustomerByPhone, saveSaleOffline,
} from '../db/offline'
import { createApiClient } from '../api/client'

// ---- Mahsulot topilmadi modal ----
function ProductNotFoundModal({ barcode, api, categories, onAdd, onCancel }: {
  barcode: string
  api: any
  categories: any[]
  onAdd: (product: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<any>({
    barcode, sku: barcode, name: '', brand: '',
    categoryId: '', unit: 'pcs', costPrice: 0, salePrice: 0,
    isWeighable: false, vatRate: 12,
  })
  const [status, setStatus] = useState<'searching' | 'found' | 'empty' | 'saving'>('searching')
  const [imageUrl, setImageUrl] = useState('')
  const [recognizing, setRecognizing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Sahifa ochilganda darhol Open Food Facts dan qidirish
    api.get(`/products/lookup/${barcode}`)
      .then(({ data }: any) => {
        if (data?.source === 'openfoodfacts' && data.product?.name) {
          const p = data.product
          setForm((f: any) => ({
            ...f,
            name: p.name || '',
            brand: p.brand || '',
            unit: p.unit || 'pcs',
          }))
          setImageUrl(p.imageUrl || '')
          setStatus('found')
        } else {
          setStatus('empty')
        }
      })
      .catch(() => setStatus('empty'))
  }, [barcode])

  const handleRecognize = async (file: File) => {
    setRecognizing(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        const { data } = await api.post('/products/recognize', {
          imageBase64: base64, mimeType: file.type,
        })
        if (data?.name) {
          setForm((f: any) => ({
            ...f,
            name: data.name || f.name,
            brand: data.brand || f.brand,
            unit: data.unit || f.unit,
          }))
          setStatus('found')
        }
        setRecognizing(false)
      }
      reader.readAsDataURL(file)
    } catch { setRecognizing(false) }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setStatus('saving')
    try {
      const { data: saved } = await api.post('/products', {
        ...form,
        categoryId: form.categoryId || undefined,
        sku: form.sku || form.barcode,
      })
      onAdd({ ...saved, sale_price: saved.salePrice, vat_rate: saved.vatRate, is_weighable: saved.isWeighable })
    } catch (e: any) {
      const msg = e?.response?.data?.message
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Xato'))
      setStatus('found')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm border border-gray-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <PackageSearch size={18} className="text-orange-400" />
            <span className="font-bold text-white text-sm">Mahsulot topilmadi</span>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-3">
          {/* Barcode + holat */}
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-900 text-blue-300 px-3 py-2 rounded-lg text-sm font-mono">{barcode}</code>
            {status === 'searching' && (
              <span className="text-xs text-gray-400 animate-pulse flex items-center gap-1">
                <Globe size={13} /> Qidirilmoqda...
              </span>
            )}
            {status === 'found' && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Globe size={13} /> Topildi
              </span>
            )}
          </div>

          {/* Rasm (Open Food Facts dan) */}
          {imageUrl && (
            <img src={imageUrl} alt="product" className="w-20 h-20 object-contain rounded-lg bg-white mx-auto" />
          )}

          {/* Form */}
          <div className="space-y-2">
            {[
              { key: 'name', label: 'Nomi *', placeholder: 'Mahsulot nomi' },
              { key: 'brand', label: 'Brend', placeholder: 'Brend' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Kirim narxi</label>
                <input
                  type="number" value={form.costPrice || ''}
                  onChange={e => setForm((f: any) => ({ ...f, costPrice: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sotuv narxi *</label>
                <input
                  type="number" value={form.salePrice || ''}
                  onChange={e => setForm((f: any) => ({ ...f, salePrice: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">O'lchov</label>
                <select
                  value={form.unit}
                  onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {['pcs', 'kg', 'g', 'l', 'ml'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Kategoriya</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm((f: any) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">—</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Claude Vision tugmasi */}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => e.target.files?.[0] && handleRecognize(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={recognizing}
            className="w-full flex items-center justify-center gap-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-purple-200 rounded-lg py-2 text-sm font-medium"
          >
            <Camera size={14} />
            {recognizing ? 'AI tahlil qilmoqda...' : 'Rasmdan AI bilan tanish'}
          </button>

          {/* Saqlash tugmasi */}
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || !form.salePrice || status === 'saving'}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
          >
            {status === 'saving' ? 'Saqlanmoqda...' : '✓ Bazaga qo\'shish va savatga solish'}
          </button>
        </div>
      </div>
    </div>
  )
}

const NUMPAD = ['7','8','9','4','5','6','1','2','3','C','0','.']

function Numpad({ onInput }: { onInput: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {NUMPAD.map((k) => (
        <button
          key={k}
          onClick={() => onInput(k)}
          className={`py-3 rounded-lg text-lg font-semibold transition-colors ${
            k === 'C'
              ? 'bg-red-700 text-white hover:bg-red-600'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  )
}

export function PosPage() {
  const {
    cart, addToCart, removeFromCart, updateQty, clearCart,
    paymentType, setPaymentType, paid, setPaid,
    customerId, customerName, bonusBalance, bonusUsed,
    setCustomer, setBonusUsed,
    shiftId, cashierId, cashierName,
    discount, setDiscount,
    getSubtotal, getTotal, getChange,
  } = usePosStore()
  const { accessToken, serverUrl } = useAuthStore()

  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [customerInput, setCustomerInput] = useState('')
  const [numpadValue, setNumpadValue] = useState('')
  const [numpadTarget, setNumpadTarget] = useState<'paid' | 'discount' | 'qty' | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const barcodeRef = useRef<HTMLInputElement>(null)

  const api = createApiClient(serverUrl, accessToken)

  useEffect(() => {
    barcodeRef.current?.focus()
    checkOnline()
    // Kategoriyalarni yuklash (modal uchun)
    api.get('/categories').then(({ data }: any) => setCategories(data)).catch(() => {})
    const onlineInterval = setInterval(checkOnline, 30000)

    // iPhone scanner polling — har 700ms da barcode tekshirish
    const scannerInterval = setInterval(async () => {
      try {
        const { data } = await api.get('/scanner/pending')
        if (data?.barcode) {
          setBarcodeInput(data.barcode)
          // handleBarcodeSubmit Enter talab qiladi, shuning uchun to'g'ridan qo'ng'iroq
          processBarcode(data.barcode)
        }
      } catch { /* offline bo'lsa ignore */ }
    }, 700)

    return () => {
      clearInterval(onlineInterval)
      clearInterval(scannerInterval)
    }
  }, [])

  const checkOnline = async () => {
    try { await api.get('/auth/me'); setIsOnline(true) }
    catch { setIsOnline(false) }
  }

  const processBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return
    setBarcodeInput('')

    let product: any = await searchProductByBarcode(barcode)

    if (!product && isOnline) {
      try {
        const { data } = await api.get(`/products/barcode/${barcode}`)
        product = { ...data, sale_price: data.salePrice, vat_rate: data.vatRate, is_weighable: data.isWeighable }
      } catch { /* topilmadi */ }
    }

    if (product) {
      if (product.is_weighable && barcode.length === 13 && ['2','21','22','23'].some(p => barcode.startsWith(p))) {
        const weightGrams = parseInt(barcode.slice(7, 12)) / 1000
        addToCart(product)
        const id = product.id
        setTimeout(() => updateQty(id, weightGrams), 0)
      } else {
        addToCart(product)
      }
    } else {
      // Mahsulot topilmadi — modal ochib, internet/AI dan qidirish
      setNotFoundBarcode(barcode)
    }
    barcodeRef.current?.focus()
  }, [isOnline])

  const handleBarcodeSubmit = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !barcodeInput.trim()) return
    processBarcode(barcodeInput.trim())
  }, [barcodeInput, processBarcode])

  const handleSearch = async (query: string) => {
    setSearchInput(query)
    if (query.length < 2) { setSearchResults([]); return }
    const results = await searchProductsByName(query)
    if (results.length === 0 && isOnline) {
      try {
        const { data } = await api.get('/products', { params: { search: query } })
        setSearchResults(data.map((p: any) => ({ ...p, sale_price: p.salePrice })))
        return
      } catch {}
    }
    setSearchResults(results)
  }

  const handleCustomerSearch = async () => {
    if (!customerInput) return
    let c: any = await getCustomerByPhone(customerInput)
    if (!c && isOnline) {
      try {
        const { data } = await api.get('/customers/by-phone', { params: { phone: customerInput } })
        c = data
      } catch {}
    }
    if (c) setCustomer(c.id, c.phone, c.name, Number(c.bonus_balance || c.bonusBalance || 0))
    else alert('Mijoz topilmadi')
  }

  const handleNumpad = (key: string) => {
    if (key === 'C') { setNumpadValue(''); return }
    const next = numpadValue + key
    setNumpadValue(next)
    const val = parseFloat(next) || 0
    if (numpadTarget === 'paid') setPaid(val)
    if (numpadTarget === 'discount') setDiscount(val)
    if (numpadTarget === 'qty' && selectedItemId) updateQty(selectedItemId, val)
  }

  const handlePaymentComplete = async () => {
    if (cart.length === 0) { alert('Savat bo\'sh'); return }
    const total = getTotal()
    if (paid < total) { alert(`Yetarli to'lov yo'q. Kerak: ${total.toLocaleString()} so'm`); return }

    const subtotal = getSubtotal()
    const bonusEarned = Math.floor(total * 0.01)
    const change = getChange()

    const saleData = {
      shiftId, cashierId,
      customerId, customerPhone: null,
      subtotal, discount, total, paid, change,
      paymentType, bonusUsed, bonusEarned,
    }

    const saleItems = cart.map((i) => ({
      productId: i.productId, name: i.name,
      qty: i.qty, price: i.price, discount: i.discount,
      total: i.total, vatRate: i.vatRate,
    }))

    let receiptNo: string

    if (isOnline) {
      try {
        const payload = {
          items: saleItems.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price, discount: i.discount })),
          paymentType, paid, discount,
          customerId: customerId || undefined,
          shiftId: shiftId || undefined,
          bonusUsed,
        }
        const { data } = await api.post('/sales', payload)
        receiptNo = data.receiptNo
      } catch {
        receiptNo = await saveSaleOffline(saleData, saleItems)
      }
    } else {
      receiptNo = await saveSaleOffline(saleData, saleItems)
    }

    // Chek chiqarish
    const receiptData = {
      shopName: 'DAURAN DOKON',
      receiptNo, cashier: cashierName,
      customer: customerName,
      items: saleItems, subtotal, discount, bonusUsed,
      total, paid, change, paymentType, bonusEarned,
      createdAt: new Date(),
    }

    if ((window as any).electronAPI) {
      await (window as any).electronAPI.printer.print(receiptData)
    }

    setLastReceipt(receiptNo)
    clearCart()
    setBarcodeInput('')
    setNumpadValue('')
    setNumpadTarget(null)
    barcodeRef.current?.focus()
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const change = getChange()

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">Dauran POS</span>
          <span className="text-sm text-gray-400">| {cashierName}</span>
        </div>
        <div className="flex items-center gap-3">
          {lastReceipt && (
            <span className="text-xs text-green-400">Oxirgi chek: {lastReceipt}</span>
          )}
          <div className={`flex items-center gap-1.5 text-xs ${isOnline ? 'text-green-400' : 'text-orange-400'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chap: savat */}
        <div className="w-[55%] flex flex-col border-r border-gray-700">
          {/* Barcode va qidiruv */}
          <div className="p-3 space-y-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeSubmit}
                placeholder="Shtrix-kod skanerlash yoki Enter..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <input
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Mahsulot nomi bo'yicha qidirish..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                  {searchResults.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { addToCart(p); setSearchInput(''); setSearchResults([]) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex justify-between items-center"
                    >
                      <span className="text-white">{p.name}</span>
                      <span className="text-green-400 font-semibold">
                        {Number(p.sale_price || p.salePrice).toLocaleString()} so'm
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Savat */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <ShoppingCart size={48} className="mb-3" />
                <p className="text-sm">Savat bo'sh</p>
                <p className="text-xs mt-1">Shtrix-kod skanerlang yoki mahsulot qidiring</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr className="text-left text-gray-400 text-xs">
                    <th className="px-3 py-2">Mahsulot</th>
                    <th className="px-2 py-2 text-center w-24">Miqdor</th>
                    <th className="px-2 py-2 text-right w-20">Narx</th>
                    <th className="px-2 py-2 text-right w-24">Jami</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {cart.map((item) => (
                    <tr
                      key={item.productId}
                      onClick={() => setSelectedItemId(item.productId === selectedItemId ? null : item.productId)}
                      className={`cursor-pointer transition-colors ${
                        selectedItemId === item.productId ? 'bg-blue-900/40' : 'hover:bg-gray-800'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.barcode}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(item.productId, Math.max(0.001, item.qty - 1)) }}
                            className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600"
                          ><Minus size={12} /></button>
                          <span className="w-10 text-center text-white font-semibold">
                            {item.unit === 'kg' ? item.qty.toFixed(3) : item.qty}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(item.productId, item.qty + 1) }}
                            className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600"
                          ><Plus size={12} /></button>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right text-gray-300">
                        {item.price.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-white">
                        {item.total.toLocaleString()}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromCart(item.productId) }}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        ><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Savat jami */}
          {cart.length > 0 && (
            <div className="border-t border-gray-700 p-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Ara jami</span>
                <span>{subtotal.toLocaleString()} so'm</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-orange-400">
                  <span>Chegirma</span>
                  <span>-{discount.toLocaleString()} so'm</span>
                </div>
              )}
              {bonusUsed > 0 && (
                <div className="flex justify-between text-sm text-yellow-400">
                  <span>Bonus</span>
                  <span>-{bonusUsed.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-white border-t border-gray-700 pt-2 mt-2">
                <span>JAMI</span>
                <span>{total.toLocaleString()} so'm</span>
              </div>
            </div>
          )}
        </div>

        {/* O'ng: to'lov paneli */}
        <div className="w-[45%] flex flex-col p-4 space-y-3">
          {/* Mijoz */}
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">MIJOZ</span>
            </div>
            {customerName ? (
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{customerName}</div>
                  <div className="text-xs text-yellow-400">Bonus: {bonusBalance.toLocaleString()}</div>
                </div>
                <button onClick={() => setCustomer(null, null, null, 0)} className="text-gray-500 hover:text-white">✕</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={customerInput}
                  onChange={(e) => setCustomerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                  placeholder="+998901234567"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleCustomerSearch}
                  className="bg-gray-700 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-600"
                >Qidirish</button>
              </div>
            )}
          </div>

          {/* To'lov turi */}
          <div>
            <div className="text-xs text-gray-400 mb-2">TO'LOV TURI</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'cash', icon: Banknote, label: "Naqd" },
                { key: 'card', icon: CreditCard, label: "Karta" },
                { key: 'click', icon: Smartphone, label: "Click" },
                { key: 'payme', icon: Smartphone, label: "Payme" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentType(key as any)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                    paymentType === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Numpad + maydon tanlash */}
          <div>
            <div className="flex gap-2 mb-2">
              {[
                { key: 'paid', label: "To'lov", value: paid },
                { key: 'discount', label: 'Chegirma', value: discount },
              ].map(({ key, label, value }) => (
                <button
                  key={key}
                  onClick={() => { setNumpadTarget(key as any); setNumpadValue(String(value || '')) }}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    numpadTarget === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}: <span className="font-bold">{value.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <div className="bg-gray-800 rounded-xl px-3 py-2 text-right text-2xl font-bold text-white mb-2 min-h-[48px]">
              {numpadValue || '0'}
            </div>

            <Numpad onInput={handleNumpad} />
          </div>

          {/* Qaytim */}
          {paid > 0 && (
            <div className={`rounded-xl p-3 text-center ${change >= 0 ? 'bg-green-900/40' : 'bg-red-900/40'}`}>
              <div className="text-xs text-gray-400">{change >= 0 ? 'QAYTIM' : 'YETISHMOVCHI'}</div>
              <div className={`text-2xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(change).toLocaleString()} so'm
              </div>
            </div>
          )}

          {/* Sotish tugmasi */}
          <button
            onClick={handlePaymentComplete}
            disabled={cart.length === 0 || paid < total}
            className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Receipt size={22} />
            Sotish — {total.toLocaleString()} so'm
          </button>

          <button
            onClick={() => { clearCart(); setNumpadValue(''); setNumpadTarget(null) }}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Savatni tozalash
          </button>
        </div>
      </div>

      {/* Mahsulot topilmadi modal */}
      {notFoundBarcode && (
        <ProductNotFoundModal
          barcode={notFoundBarcode}
          api={api}
          categories={categories}
          onAdd={(product) => {
            addToCart(product)
            setNotFoundBarcode(null)
            barcodeRef.current?.focus()
          }}
          onCancel={() => {
            setNotFoundBarcode(null)
            barcodeRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}
