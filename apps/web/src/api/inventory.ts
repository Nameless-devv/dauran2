import api from './client'

export const inventoryApi = {
  getAll: () => api.get('/inventory').then((r) => r.data),
  getActive: () => api.get('/inventory/active').then((r) => r.data),
  getOne: (id: string) => api.get(`/inventory/${id}`).then((r) => r.data),
  start: (note?: string) => api.post('/inventory/start', { note }).then((r) => r.data),
  updateQty: (inventoryId: string, productId: string, actualQty: number, note?: string) =>
    api.patch(`/inventory/${inventoryId}/items/${productId}`, { actualQty, note }).then((r) => r.data),
  complete: (id: string) => api.post(`/inventory/${id}/complete`).then((r) => r.data),
}
