import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Helper pour vérifier l'URL utilisée
export const getApiUrl = () => API_URL

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Intercepteur pour ajouter le token
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

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else {
      // Autres erreurs serveur
      // Optionnel: Affiche un toast ou log
      // console.error('Erreur API:', error)
    }
    return Promise.reject(error)
  }
)

const authService = {
  // Connexion
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Inscription
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Déconnexion (pas de body)
  async logout() {
    const response = await api.post('/auth/logout')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return response.data
  },

  // Refresh token
  async refreshToken(token = null) {
    // Si pas de token passé, essaie de le récupérer dans le stockage
    const usedToken = token || localStorage.getItem('token')
    const response = await api.post('/auth/refresh', { token: usedToken })
    return response.data
  },
}

export default authService