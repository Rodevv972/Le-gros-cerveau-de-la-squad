import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../common/LoadingScreen'

const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminRequired && !isAdmin()) {
    return <Navigate to="/lobby" replace />
  }

  return children
}

export default ProtectedRoute