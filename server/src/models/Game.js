const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  category: {
    type: String,
    required: true,
    enum: ['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general', 'mixed']
  },
  maxPlayers: {
    type: Number,
    default: 50,
    min: 2,
    max: 100
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    avatar: String,
    lives: {
      type: Number,
      default: 3
    },
    score: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isSpectator: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastAnswerTime: Date,
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedOption: Number,
      isCorrect: Boolean,
      responseTime: Number, // en millisecondes
      answeredAt: { type: Date, default: Date.now }
    }]
  }],
  spectators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    avatar: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  leaderboard: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    score: Number,
    position: Number,
    lives: Number,
    isActive: Boolean
  }],
  settings: {
    questionTimer: {
      type: Number,
      default: 15 // secondes
    },
    livesPerPlayer: {
      type: Number,
      default: 3
    },
    pointsPerCorrectAnswer: {
      type: Number,
      default: 100
    },
    bonusPointsForSpeed: {
      type: Number,
      default: 50
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: Date,
  finishedAt: Date,
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gameStats: {
    totalPlayers: { type: Number, default: 0 },
    totalSpectators: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 }
  }
}, {
  timestamps: true
})

// Index pour les recherches
gameSchema.index({ status: 1, createdAt: -1 })
gameSchema.index({ createdBy: 1 })
gameSchema.index({ 'players.userId': 1 })

// Méthode pour ajouter un joueur
gameSchema.methods.addPlayer = function(user) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error('Partie complète')
  }
  
  const existingPlayer = this.players.find(p => p.userId.toString() === user._id.toString())
  if (existingPlayer) {
    throw new Error('Joueur déjà dans la partie')
  }
  
  this.players.push({
    userId: user._id,
    username: user.username,
    avatar: user.avatar,
    lives: this.settings.livesPerPlayer
  })
  
  this.gameStats.totalPlayers = this.players.length
}

// Méthode pour ajouter un spectateur
gameSchema.methods.addSpectator = function(user) {
  const existingSpectator = this.spectators.find(s => s.userId.toString() === user._id.toString())
  if (!existingSpectator) {
    this.spectators.push({
      userId: user._id,
      username: user.username,
      avatar: user.avatar
    })
    this.gameStats.totalSpectators = this.spectators.length
  }
}

// Méthode pour retirer une vie à un joueur
gameSchema.methods.removeLife = function(userId) {
  const player = this.players.find(p => p.userId.toString() === userId.toString())
  if (player) {
    player.lives -= 1
    if (player.lives <= 0) {
      player.isActive = false
      player.isSpectator = true
      // Déplacer vers les spectateurs
      this.addSpectator({
        _id: player.userId,
        username: player.username,
        avatar: player.avatar
      })
    }
  }
}

// Méthode pour calculer le score d'une réponse
gameSchema.methods.calculateScore = function(responseTime, isCorrect) {
  if (!isCorrect) return 0
  
  const basePoints = this.settings.pointsPerCorrectAnswer
  const maxBonusPoints = this.settings.bonusPointsForSpeed
  const timerSeconds = this.settings.questionTimer
  
  // Bonus basé sur la rapidité (plus on répond vite, plus on a de points)
  const speedBonus = Math.max(0, maxBonusPoints * (1 - responseTime / (timerSeconds * 1000)))
  
  return Math.round(basePoints + speedBonus)
}

// Méthode pour mettre à jour le leaderboard
gameSchema.methods.updateLeaderboard = function() {
  const activePlayers = this.players
    .filter(p => !p.isSpectator)
    .sort((a, b) => {
      // Tri par score décroissant, puis par nombre de vies décroissant
      if (b.score !== a.score) return b.score - a.score
      return b.lives - a.lives
    })
  
  this.leaderboard = activePlayers.map((player, index) => ({
    userId: player.userId,
    username: player.username,
    score: player.score,
    position: index + 1,
    lives: player.lives,
    isActive: player.isActive
  }))
}

// Méthode pour vérifier si la partie est terminée
gameSchema.methods.isGameOver = function() {
  const activePlayers = this.players.filter(p => p.isActive && !p.isSpectator)
  return activePlayers.length <= 1 || this.currentQuestionIndex >= this.questions.length
}

// Méthode pour finir la partie
gameSchema.methods.finishGame = function() {
  this.status = 'finished'
  this.finishedAt = new Date()
  
  this.updateLeaderboard()
  
  if (this.leaderboard.length > 0) {
    this.winner = this.leaderboard[0].userId
  }
  
  // Calcul des statistiques finales
  const totalScore = this.players.reduce((sum, p) => sum + p.score, 0)
  this.gameStats.averageScore = totalScore / this.players.length
  
  const totalResponseTime = this.players.reduce((sum, p) => {
    const playerAvgTime = p.answers.reduce((avgSum, a) => avgSum + (a.responseTime || 0), 0) / (p.answers.length || 1)
    return sum + playerAvgTime
  }, 0)
  this.gameStats.averageResponseTime = totalResponseTime / this.players.length
  
  this.gameStats.questionsAnswered = this.currentQuestionIndex
}

module.exports = mongoose.model('Game', gameSchema)