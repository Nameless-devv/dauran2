import { create } from 'zustand'

export interface CartItem {
  productId: string
  barcode: string
  name: string
  qty: number
  price: number
  discount: number
  total: number
  vatRate: number
  unit: string
  isWeighable: boolean
}

export interface PosState {
  // Savat
  cart: CartItem[]
  discount: number
  paymentType: 'cash' | 'card' | 'click' | 'payme'
  paid: number
  customerId: string | null
  customerPhone: string | null
  customerName: string | null
  bonusBalance: number
  bonusUsed: number

  // Smena
  shiftId: string | null
  shiftOpened: boolean
  cashierId: string | null
  cashierName: string | null

  // Holat
  isOnline: boolean
  lastSyncAt: Date | null

  // Savatga qo'shish
  addToCart: (product: any) => void
  removeFromCart: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  updateDiscount: (productId: string, discount: number) => void
  clearCart: () => void

  // Hisob-kitob
  setDiscount: (amount: number) => void
  setPaymentType: (type: PosState['paymentType']) => void
  setPaid: (amount: number) => void
  setCustomer: (id: string | null, phone: string | null, name: string | null, bonus: number) => void
  setBonusUsed: (amount: number) => void

  // Smena
  setShift: (shiftId: string | null, opened: boolean) => void
  setCashier: (id: string, name: string) => void

  // Hisoblash
  getSubtotal: () => number
  getTotal: () => number
  getChange: () => number
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  discount: 0,
  paymentType: 'cash',
  paid: 0,
  customerId: null,
  customerPhone: null,
  customerName: null,
  bonusBalance: 0,
  bonusUsed: 0,
  shiftId: null,
  shiftOpened: false,
  cashierId: null,
  cashierName: null,
  isOnline: false,
  lastSyncAt: null,

  addToCart: (product) => set((state) => {
    const existing = state.cart.find((i) => i.productId === product.id)
    if (existing) {
      return {
        cart: state.cart.map((i) =>
          i.productId === product.id
            ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price - i.discount }
            : i
        ),
      }
    }
    const newItem: CartItem = {
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      qty: 1,
      price: Number(product.sale_price || product.salePrice),
      discount: 0,
      total: Number(product.sale_price || product.salePrice),
      vatRate: Number(product.vat_rate || product.vatRate || 12),
      unit: product.unit || 'pcs',
      isWeighable: !!(product.is_weighable || product.isWeighable),
    }
    return { cart: [...state.cart, newItem] }
  }),

  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) })),

  updateQty: (productId, qty) => set((state) => ({
    cart: state.cart.map((i) =>
      i.productId === productId
        ? { ...i, qty, total: qty * i.price - i.discount }
        : i
    ),
  })),

  updateDiscount: (productId, discount) => set((state) => ({
    cart: state.cart.map((i) =>
      i.productId === productId
        ? { ...i, discount, total: i.qty * i.price - discount }
        : i
    ),
  })),

  clearCart: () => set({ cart: [], discount: 0, paid: 0, bonusUsed: 0, customerId: null, customerPhone: null, customerName: null, bonusBalance: 0 }),

  setDiscount: (amount) => set({ discount: amount }),
  setPaymentType: (type) => set({ paymentType: type }),
  setPaid: (amount) => set({ paid: amount }),
  setCustomer: (id, phone, name, bonus) => set({ customerId: id, customerPhone: phone, customerName: name, bonusBalance: bonus }),
  setBonusUsed: (amount) => set({ bonusUsed: amount }),
  setShift: (shiftId, opened) => set({ shiftId, shiftOpened: opened }),
  setCashier: (id, name) => set({ cashierId: id, cashierName: name }),

  getSubtotal: () => get().cart.reduce((s, i) => s + i.total, 0),
  getTotal: () => {
    const { getSubtotal, discount, bonusUsed } = get()
    return Math.max(0, getSubtotal() - discount - bonusUsed)
  },
  getChange: () => {
    const { paid, getTotal } = get()
    return Math.max(0, paid - getTotal())
  },
}))
