import api from './client'

export const productsApi = {
  getAll: (search?: string) =>
    api.get('/products', { params: search ? { search } : {} }).then((r) => r.data),

  getOne: (id: string) => api.get(`/products/${id}`).then((r) => r.data),

  getByBarcode: (barcode: string) =>
    api.get(`/products/barcode/${barcode}`).then((r) => r.data),

  create: (data: any) => api.post('/products', data).then((r) => r.data),

  update: (id: string, data: any) => api.patch(`/products/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
}

export const categoriesApi = {
  getAll: () => api.get('/categories').then((r) => r.data),
  create: (data: any) => api.post('/categories', data).then((r) => r.data),
}
