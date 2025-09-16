import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const [currentGame, setCurrentGame] = useState(null)
  const [gameData, setGameData] = useState(null)
  const { user, getToken } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (user && getToken()) {
      initializeSocket()
    } else {
      disconnectSocket()
    }

    // Nettoyage quand le composant est démonté ou user change
    return () => {
      disconnectSocket()
    }
    // eslint-disable-next-line
  }, [user])

  const initializeSocket = () => {
    const token = getToken()
    if (!token) return

    // Utilisation de l'IP locale ou du fallback
    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

    // Déconnexion de l'ancien socket si présent
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const newSocket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    // Gestion des événements
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

    // Pour silence ou custom
    newSocket.on('spectatorJoined', () => {})

    newSocket.on('error', (data) => {
      toast.error(data.message)
    })

    socketRef.current = newSocket
  }

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setConnected(false)
    setCurrentGame(null)
    setGameData(null)
  }

  // Méthodes d'émission
  const createGame = (gameData) => {
    if (socketRef.current) {
      socketRef.current.emit('createGame', gameData)
    }
  }

  const joinGame = (gameId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinGame', gameId)
    }
  }

  const startGame = (gameId) => {
    if (socketRef.current) {
      socketRef.current.emit('startGame', gameId)
    }
  }

  const submitAnswer = (answerData) => {
    if (socketRef.current) {
      socketRef.current.emit('submitAnswer', answerData)
    }
  }

  const leaveGame = () => {
    if (socketRef.current && currentGame) {
      socketRef.current.emit('leaveGame', currentGame)
      setCurrentGame(null)
      setGameData(null)
    }
  }

  const getGameStats = (gameId) => {
    if (socketRef.current) {
      socketRef.current.emit('getGameStats', gameId)
    }
  }

  // Méthodes d'écoute personnalisées
  const onGameEvent = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
      return () => socketRef.current.off(event, callback)
    }
    return () => {}
  }

  const offGameEvent = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }

  const value = {
    socket: socketRef.current,
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