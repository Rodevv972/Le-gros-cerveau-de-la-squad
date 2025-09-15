import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Configuration axios
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
  (error) => {
    return Promise.reject(error)
  }
)

const gameService = {
  // Obtenir les parties disponibles
  async getAvailableGames() {
    const response = await api.get('/game/available')
    return response.data
  },

  // Obtenir les détails d'une partie
  async getGameDetails(gameId) {
    const response = await api.get(`/game/${gameId}`)
    return response.data
  },

  // Créer une nouvelle partie (admin)
  async createGame(gameData) {
    const response = await api.post('/game/create', gameData)
    return response.data
  },

  // Rejoindre une partie
  async joinGame(gameId) {
    const response = await api.post(`/game/${gameId}/join`)
    return response.data
  },

  // Obtenir l'historique des parties
  async getGameHistory(page = 1, limit = 10) {
    const response = await api.get('/game/user/history', {
      params: { page, limit }
    })
    return response.data
  },

  // Obtenir les statistiques générales
  async getGeneralStats() {
    const response = await api.get('/game/stats/general')
    return response.data
  },
}

export default gameService