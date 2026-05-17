import api from './client'

export const reportsApi = {
  daily: (date?: string) => api.get('/reports/daily', { params: { date } }).then((r) => r.data),
  monthly: (year?: number, month?: number) =>
    api.get('/reports/monthly', { params: { year, month } }).then((r) => r.data),
  abc: () => api.get('/reports/abc').then((r) => r.data),
  stock: () => api.get('/reports/stock').then((r) => r.data),
}
