const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const Game = require('../models/Game')
const Question = require('../models/Question')
const { auth, adminAuth } = require('../middleware/auth')
const perplexityService = require('../services/perplexityService')
const logger = require('../utils/logger')

const router = express.Router()

// Tableau de bord admin
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGames,
      activeGames,
      totalQuestions,
      recentGames
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Game.countDocuments(),
      Game.countDocuments({ status: { $in: ['waiting', 'playing'] } }),
      Question.countDocuments({ approved: true }),
      Game.find({ status: { $in: ['waiting', 'playing', 'finished'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'username')
        .populate('winner', 'username')
    ])

    const formattedRecentGames = recentGames.map(game => ({
      id: game._id,
      name: game.name,
      category: game.category,
      status: game.status,
      players: game.players.length,
      createdBy: game.createdBy.username,
      createdAt: game.createdAt,
      winner: game.winner?.username || null
    }))

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalGames,
        activeGames,
        totalQuestions
      },
      recentGames: formattedRecentGames
    })

  } catch (error) {
    logger.error('Erreur dashboard admin:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Gestion des utilisateurs
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments()

    res.json({
      users,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    logger.error('Erreur liste utilisateurs:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Suspendre/activer un utilisateur
router.patch('/users/:userId/status', auth, adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body
    const user = await User.findById(req.params.userId)

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    user.isActive = isActive
    await user.save()

    res.json({
      message: `Utilisateur ${isActive ? 'activé' : 'suspendu'} avec succès`,
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    })

    logger.info(`Utilisateur ${user.username} ${isActive ? 'activé' : 'suspendu'} par ${req.user.username}`)

  } catch (error) {
    logger.error('Erreur modification statut utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Gestion des parties (admin)
router.get('/games', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status
    const skip = (page - 1) * limit

    const filter = {}
    if (status) filter.status = status

    const games = await Game.find(filter)
      .populate('createdBy', 'username')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Game.countDocuments(filter)

    const formattedGames = games.map(game => ({
      id: game._id,
      name: game.name,
      category: game.category,
      status: game.status,
      players: game.players.length,
      spectators: game.spectators.length,
      createdBy: game.createdBy.username,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      winner: game.winner?.username || null
    }))

    res.json({
      games: formattedGames,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    logger.error('Erreur liste parties admin:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer une partie
router.delete('/games/:gameId', auth, adminAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' })
    }

    if (game.status === 'playing') {
      return res.status(400).json({ error: 'Impossible de supprimer une partie en cours' })
    }

    await Game.findByIdAndDelete(req.params.gameId)

    res.json({ message: 'Partie supprimée avec succès' })

    logger.info(`Partie ${game.name} supprimée par ${req.user.username}`)

  } catch (error) {
    logger.error('Erreur suppression partie:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Gestion des questions
router.get('/questions', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const category = req.query.category
    const approved = req.query.approved
    const skip = (page - 1) * limit

    const filter = {}
    if (category) filter.category = category
    if (approved !== undefined) filter.approved = approved === 'true'

    const questions = await Question.find(filter)
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Question.countDocuments(filter)

    res.json({
      questions,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    logger.error('Erreur liste questions admin:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Approuver/rejeter une question
router.patch('/questions/:questionId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { approved } = req.body
    const question = await Question.findById(req.params.questionId)

    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' })
    }

    question.approved = approved
    question.approvedBy = req.user._id
    await question.save()

    res.json({
      message: `Question ${approved ? 'approuvée' : 'rejetée'} avec succès`,
      question: {
        id: question._id,
        approved: question.approved
      }
    })

    logger.info(`Question ${question._id} ${approved ? 'approuvée' : 'rejetée'} par ${req.user.username}`)

  } catch (error) {
    logger.error('Erreur approbation question:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Générer des questions via OpenAI
router.post('/questions/generate', auth, adminAuth, [
  body('category').isIn(['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general']),
  body('count').isInt({ min: 1, max: 20 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { category, count, difficulty = 'medium' } = req.body

    const questions = await openaiService.generateQuestions(category, count, difficulty)

    res.json({
      message: `${questions.length} question(s) générée(s) avec succès`,
      questions: questions.map(q => ({
        id: q._id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        createdAt: q.createdAt
      }))
    })

    logger.info(`${questions.length} questions générées en ${category} par ${req.user.username}`)

  } catch (error) {
    logger.error('Erreur génération questions:', error)
    res.status(500).json({ error: 'Erreur lors de la génération des questions' })
  }
})

// Exporter les données en CSV
router.get('/export/:type', auth, adminAuth, async (req, res) => {
  try {
    const { type } = req.params
    
    let data = []
    let filename = ''
    let headers = []

    switch (type) {
    case 'users':
      data = await User.find().select('-password').lean()
      filename = 'users_export.csv'
      headers = ['username', 'email', 'role', 'stats.totalGames', 'stats.totalWins', 'createdAt']
      break
        
    case 'games':
      data = await Game.find({ status: 'finished' })
        .populate('createdBy', 'username')
        .populate('winner', 'username')
        .lean()
      filename = 'games_export.csv'
      headers = ['name', 'category', 'gameStats.totalPlayers', 'createdBy.username', 'winner.username', 'createdAt', 'finishedAt']
      break
        
    case 'questions':
      data = await Question.find().populate('createdBy', 'username').lean()
      filename = 'questions_export.csv'
      headers = ['question', 'category', 'difficulty', 'source', 'usageCount', 'correctAnswerRate', 'createdAt']
      break
        
    default:
      return res.status(400).json({ error: 'Type d\'export invalide' })
    }

    // Convertir en CSV simple
    const csvLines = [headers.join(',')]
    
    data.forEach(item => {
      const values = headers.map(header => {
        const value = header.split('.').reduce((obj, key) => obj?.[key], item)
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || ''
      })
      csvLines.push(values.join(','))
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.send(csvLines.join('\n'))

    logger.info(`Export ${type} effectué par ${req.user.username}`)

  } catch (error) {
    logger.error('Erreur export:', error)
    res.status(500).json({ error: 'Erreur lors de l\'export' })
  }
})

// Statistiques détaillées
router.get('/stats/detailed', auth, adminAuth, async (req, res) => {
  try {
    const [
      userStats,
      gameStats,
      questionStats,
      recentActivity
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            avgGames: { $avg: '$stats.totalGames' },
            avgScore: { $avg: '$stats.totalScore' }
          }
        }
      ]),
      Game.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Question.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            approved: { $sum: { $cond: ['$approved', 1, 0] } },
            avgUsage: { $avg: '$usageCount' }
          }
        }
      ]),
      Promise.all([
        User.find().sort({ createdAt: -1 }).limit(5).select('username createdAt'),
        Game.find().sort({ createdAt: -1 }).limit(5).select('name createdAt').populate('createdBy', 'username')
      ])
    ])

    res.json({
      users: userStats[0] || {},
      games: gameStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
      questions: questionStats,
      recentActivity: {
        newUsers: recentActivity[0],
        newGames: recentActivity[1]
      }
    })

  } catch (error) {
    logger.error('Erreur stats détaillées:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router