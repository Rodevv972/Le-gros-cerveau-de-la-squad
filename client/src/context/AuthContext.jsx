import React, { createContext, useContext, useReducer, useEffect } from 'react'
import authService from '../services/authService'
import { toast } from 'react-toastify'

const AuthContext = createContext()

// Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      }
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    default:
      return state
  }
}

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      checkAuthStatus()
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }, [])

  // Vérifier le statut d'authentification
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return
      }

      // Ici on pourrait faire un appel pour vérifier le token
      // Pour l'instant, on fait confiance au token stocké
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        })
      } else {
        localStorage.removeItem('token')
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }

  // Connexion
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const response = await authService.login(credentials)
      
      // Stocker en localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response
      })
      
      toast.success(`Bienvenue, ${response.user.username} !`)
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Erreur de connexion'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message })
      toast.error(message)
      throw error
    }
  }

  // Inscription
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const response = await authService.register(userData)
      
      // Stocker en localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response
      })
      
      toast.success(`Compte créé ! Bienvenue, ${response.user.username} !`)
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Erreur lors de l\'inscription'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message })
      toast.error(message)
      throw error
    }
  }

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
    toast.info('Déconnexion réussie')
  }

  // Mettre à jour le profil utilisateur
  const updateUser = (updatedData) => {
    const updatedUser = { ...state.user, ...updatedData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedData })
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    return state.user?.role === 'admin'
  }

  // Obtenir le token pour les requêtes
  const getToken = () => {
    return state.token || localStorage.getItem('token')
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    getToken,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}