import api from './client'

export const stockApi = {
  getAll: () => api.get('/stock').then((r) => r.data),
  getLow: () => api.get('/stock/low').then((r) => r.data),
  getMovements: (productId?: string) =>
    api.get('/stock/movements', { params: productId ? { productId } : {} }).then((r) => r.data),
  createPurchase: (data: any) => api.post('/stock/purchases', data).then((r) => r.data),
  getPurchases: () => api.get('/stock/purchases').then((r) => r.data),
  adjust: (productId: string, qty: number, note: string) =>
    api.post(`/stock/adjust/${productId}`, { qty, note }).then((r) => r.data),
}
