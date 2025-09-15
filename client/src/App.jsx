import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/AdminPage'

// Components
import Navbar from './components/layout/Navbar'
import LoadingScreen from './components/common/LoadingScreen'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="App">
      <Navbar />
      
      <Routes>
        {/* Routes publiques */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/lobby" replace /> : <HomePage />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/lobby" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/lobby" replace /> : <RegisterPage />} 
        />
        
        {/* Routes protégées */}
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <LobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Routes admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminRequired>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App