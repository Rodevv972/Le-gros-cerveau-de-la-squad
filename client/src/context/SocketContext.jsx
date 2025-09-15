import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [currentGame, setCurrentGame] = useState(null)
  const [gameData, setGameData] = useState(null)
  const { user, getToken } = useAuth()

  useEffect(() => {
    if (user && getToken()) {
      initializeSocket()
    } else {
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [user])

  const initializeSocket = () => {
    const token = getToken()
    if (!token) return

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Socket connecté:', newSocket.id)
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket déconnecté')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Erreur connexion socket:', error)
      toast.error('Erreur de connexion en temps réel')
    })

    // Événements de jeu
    newSocket.on('gameCreated', (data) => {
      toast.success('Partie créée avec succès !')
    })

    newSocket.on('joinedGame', (data) => {
      setCurrentGame(data.game.id)
      setGameData(data.game)
      toast.success('Vous avez rejoint la partie !')
    })

    newSocket.on('joinedAsSpectator', (data) => {
      setCurrentGame(data.game.id)
      setGameData(data.game)
      toast.info('Vous regardez la partie en tant que spectateur')
    })

    newSocket.on('gameStarted', (data) => {
      toast.info('La partie commence !', {
        icon: '🚀'
      })
    })

    newSocket.on('newQuestion', (data) => {
      // Sera géré par les composants de jeu
    })

    newSocket.on('questionEnded', (data) => {
      // Sera géré par les composants de jeu
    })

    newSocket.on('answerSubmitted', (data) => {
      if (data.isCorrect) {
        toast.success(`Bonne réponse ! +${data.score} points`, {
          icon: '✅'
        })
      } else {
        toast.error('Mauvaise réponse !', {
          icon: '❌'
        })
      }
    })

    newSocket.on('eliminated', (data) => {
      toast.warning(data.message, {
        icon: '💀'
      })
    })

    newSocket.on('playerEliminated', (data) => {
      toast.info(`${data.username} a été éliminé !`)
    })

    newSocket.on('gameFinished', (data) => {
      if (data.winner) {
        toast.success(`Partie terminée ! Gagnant: ${data.winner.username}`, {
          icon: '🏆'
        })
      } else {
        toast.info('Partie terminée !')
      }
      setCurrentGame(null)
      setGameData(null)
    })

    newSocket.on('playerJoined', (data) => {
      toast.info(`${data.username} a rejoint la partie`)
    })

    newSocket.on('playerLeft', (data) => {
      toast.info(`${data.username} a quitté la partie`)
    })

    newSocket.on('spectatorJoined', (data) => {
      // Notification silencieuse pour les spectateurs
    })

    newSocket.on('error', (data) => {
      toast.error(data.message)
    })

    setSocket(newSocket)
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setConnected(false)
      setCurrentGame(null)
      setGameData(null)
    }
  }

  // Méthodes d'émission
  const createGame = (gameData) => {
    if (socket) {
      socket.emit('createGame', gameData)
    }
  }

  const joinGame = (gameId) => {
    if (socket) {
      socket.emit('joinGame', gameId)
    }
  }

  const startGame = (gameId) => {
    if (socket) {
      socket.emit('startGame', gameId)
    }
  }

  const submitAnswer = (answerData) => {
    if (socket) {
      socket.emit('submitAnswer', answerData)
    }
  }

  const leaveGame = () => {
    if (socket && currentGame) {
      socket.emit('leaveGame', currentGame)
      setCurrentGame(null)
      setGameData(null)
    }
  }

  const getGameStats = (gameId) => {
    if (socket) {
      socket.emit('getGameStats', gameId)
    }
  }

  // Méthodes d'écoute personnalisées
  const onGameEvent = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
      return () => socket.off(event, callback)
    }
    return () => {}
  }

  const offGameEvent = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  const value = {
    socket,
    connected,
    currentGame,
    gameData,
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    leaveGame,
    getGameStats,
    onGameEvent,
    offGameEvent,
    setGameData,
    setCurrentGame
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}