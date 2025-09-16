import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Ajout du token si nécessaire (optionnel, sinon mutualise avec authService)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

const apiService = {
  // Stats admin
  async getAdminStats() {
    const { data } = await api.get('/admin/stats')
    return data
  },

  // Liste utilisateurs
  async getAllUsers() {
    const { data } = await api.get('/admin/users')
    return data
  },

  // Suppression utilisateur
  async deleteUser(id) {
    await api.delete(`/admin/users/${id}`)
  },

  // Reset complet de la base de données
  async resetDatabase() {
    const { data } = await api.post('/admin/reset')
    return data
  }
}

export default apiService