const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const User = require('../../models/User')
const Game = require('../../models/Game')
const adminRouter = require('../admin')
const { auth, adminAuth } = require('../../middleware/auth')

// Mock middleware
jest.mock('../../middleware/auth', () => ({
  auth: jest.fn((req, res, next) => {
    req.user = { _id: 'admin123', username: 'admin', role: 'admin' }
    next()
  }),
  adminAuth: jest.fn((req, res, next) => next())
}))

// Mock logger
jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}))

const app = express()
app.use(express.json())
app.use('/admin', adminRouter)

describe('Admin Reset Route', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock mongoose methods
    Game.deleteMany = jest.fn()
    User.updateMany = jest.fn()
  })

  describe('POST /admin/reset', () => {
    it('should successfully reset database when user is admin', async () => {
      // Mock successful operations
      Game.deleteMany.mockResolvedValue({ deletedCount: 10 })
      User.updateMany
        .mockResolvedValueOnce({ modifiedCount: 5 }) // First updateMany call
        .mockResolvedValueOnce({ modifiedCount: 5 }) // Second updateMany call

      const response = await request(app)
        .post('/admin/reset')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        message: 'Base de données réinitialisée avec succès',
        details: {
          gamesDeleted: 10,
          usersReset: 5,
          adminsPreserved: true
        }
      })

      // Verify that Game.deleteMany was called
      expect(Game.deleteMany).toHaveBeenCalledWith({})

      // Verify that User.updateMany was called correctly
      expect(User.updateMany).toHaveBeenCalledTimes(2)
      
      // First call - reset stats
      expect(User.updateMany).toHaveBeenNthCalledWith(1,
        { role: { $ne: 'admin' } },
        {
          $set: {
            'stats.totalGames': 0,
            'stats.totalWins': 0,
            'stats.totalCorrectAnswers': 0,
            'stats.totalQuestions': 0,
            'stats.averageResponseTime': 0,
            'stats.currentStreak': 0,
            'stats.bestStreak': 0,
            'stats.totalScore': 0
          },
          $unset: {
            'badges': 1,
            'gameHistory': 1
          }
        }
      )

      // Second call - reset arrays
      expect(User.updateMany).toHaveBeenNthCalledWith(2,
        { role: { $ne: 'admin' } },
        {
          $set: {
            'badges': [],
            'gameHistory': []
          }
        }
      )
    })

    it('should return error when database operation fails', async () => {
      // Mock database error
      Game.deleteMany.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/admin/reset')
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: 'Erreur serveur lors de la réinitialisation'
      })
    })

    it('should reject non-admin users even if they pass adminAuth', async () => {
      // Override the mock to simulate non-admin user
      auth.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'user123', username: 'user', role: 'user' }
        next()
      })

      const response = await request(app)
        .post('/admin/reset')
        .expect(403)

      expect(response.body).toEqual({
        error: 'Accès refusé - Droits administrateur requis'
      })

      // Verify no database operations were called
      expect(Game.deleteMany).not.toHaveBeenCalled()
      expect(User.updateMany).not.toHaveBeenCalled()
    })
  })
})