import api from './client'

export const salesApi = {
  getAll: (from?: string, to?: string) =>
    api.get('/sales', { params: { from, to } }).then((r) => r.data),

  getOne: (id: string) => api.get(`/sales/${id}`).then((r) => r.data),

  create: (data: any) => api.post('/sales', data).then((r) => r.data),

  return: (id: string) => api.post(`/sales/${id}/return`).then((r) => r.data),
}

export const shiftsApi = {
  getActive: () => api.get('/shifts/active').then((r) => r.data),
  open: (openingCash: number) => api.post('/shifts/open', { openingCash }).then((r) => r.data),
  close: (closingCash: number) => api.post('/shifts/close', { closingCash }).then((r) => r.data),
  getAll: () => api.get('/shifts').then((r) => r.data),
}
