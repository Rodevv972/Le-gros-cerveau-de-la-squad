const express = require('express');
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const Question = require('../models/Question');
const { auth, adminAuth } = require('../middleware/auth');
const perplexityService = require('../services/perplexityService');
const logger = require('../utils/logger');

const router = express.Router();

// Obtenir les parties disponibles
router.get('/available', async (req, res) => {
  try {
    const games = await Game.find({ 
      status: 'waiting'
    })
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 })
    .limit(20);

    const formattedGames = games.map(game => ({
      id: game._id,
      name: game.name,
      category: game.category,
      currentPlayers: game.players.length,
      maxPlayers: game.maxPlayers,
      status: game.status,
      createdBy: game.createdBy.username,
      createdAt: game.createdAt
    }));

    res.json(formattedGames);
  } catch (error) {
    logger.error('Erreur récupération parties:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les détails d'une partie
router.get('/:gameId', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate('createdBy', 'username')
      .populate('questions');

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // Vérifier si l'utilisateur participe à la partie
    const isPlayer = game.players.some(p => p.userId.toString() === req.user._id.toString());
    const isSpectator = game.spectators.some(s => s.userId.toString() === req.user._id.toString());
    const isCreator = game.createdBy._id.toString() === req.user._id.toString();

    if (!isPlayer && !isSpectator && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé à cette partie' });
    }

    res.json({
      id: game._id,
      name: game.name,
      category: game.category,
      status: game.status,
      currentQuestionIndex: game.currentQuestionIndex,
      totalQuestions: game.questions.length,
      players: game.players.map(p => ({
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        lives: p.lives,
        isActive: p.isActive,
        isSpectator: p.isSpectator
      })),
      spectators: game.spectators.map(s => ({
        username: s.username,
        avatar: s.avatar
      })),
      leaderboard: game.leaderboard,
      settings: game.settings,
      createdBy: game.createdBy.username,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt
    });

  } catch (error) {
    logger.error('Erreur détails partie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle partie (admin seulement)
router.post('/create', auth, adminAuth, [
  body('name').notEmpty().withMessage('Nom de partie requis'),
  body('category').isIn(['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general', 'mixed']).withMessage('Catégorie invalide'),
  body('maxPlayers').optional().isInt({ min: 2, max: 100 }).withMessage('Nombre de joueurs invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, maxPlayers, questionCount } = req.body;

    // Générer des questions si nécessaire
    let questions = [];
    if (category !== 'mixed' && questionCount > 0) {
      try {
        const generatedQuestions = await openaiService.generateQuestions(
          category, 
          questionCount || 10, 
          'medium'
        );
        questions = generatedQuestions.map(q => q._id);
      } catch (error) {
        logger.warn('Échec génération questions, utilisation questions existantes:', error);
        // Fallback: utiliser questions existantes
        const existingQuestions = await Question.find({ 
          category, 
          approved: true, 
          isActive: true 
        }).limit(questionCount || 10);
        questions = existingQuestions.map(q => q._id);
      }
    } else {
      // Pour les parties mixtes, prendre des questions de toutes catégories
      const existingQuestions = await Question.find({ 
        approved: true, 
        isActive: true 
      }).limit(questionCount || 10);
      questions = existingQuestions.map(q => q._id);
    }

    const game = new Game({
      name,
      category,
      maxPlayers: maxPlayers || 50,
      questions,
      createdBy: req.user._id
    });

    await game.save();

    res.status(201).json({
      message: 'Partie créée avec succès',
      gameId: game._id,
      game: {
        id: game._id,
        name: game.name,
        category: game.category,
        maxPlayers: game.maxPlayers,
        questionCount: questions.length,
        status: game.status
      }
    });

    logger.info(`Partie créée: ${name} par ${req.user.username}`);

  } catch (error) {
    logger.error('Erreur création partie:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la partie' });
  }
});

// Rejoindre une partie
router.post('/:gameId/join', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    if (game.status === 'finished') {
      return res.status(400).json({ error: 'Cette partie est terminée' });
    }

    // Vérifier si déjà dans la partie
    const existingPlayer = game.players.find(p => p.userId.toString() === req.user._id.toString());
    const existingSpectator = game.spectators.find(s => s.userId.toString() === req.user._id.toString());

    if (existingPlayer || existingSpectator) {
      return res.status(400).json({ error: 'Vous êtes déjà dans cette partie' });
    }

    if (game.status === 'waiting' && game.players.length < game.maxPlayers) {
      // Rejoindre comme joueur
      game.addPlayer(req.user);
      await game.save();
      
      res.json({ 
        message: 'Vous avez rejoint la partie comme joueur',
        role: 'player',
        playerCount: game.players.length
      });
    } else {
      // Rejoindre comme spectateur
      game.addSpectator(req.user);
      await game.save();
      
      res.json({ 
        message: 'Vous avez rejoint la partie comme spectateur',
        role: 'spectator',
        spectatorCount: game.spectators.length
      });
    }

  } catch (error) {
    logger.error('Erreur rejoindre partie:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Obtenir l'historique des parties
router.get('/user/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      $or: [
        { 'players.userId': req.user._id },
        { 'spectators.userId': req.user._id }
      ],
      status: 'finished'
    })
    .sort({ finishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('winner', 'username avatar');

    const gameHistory = games.map(game => {
      const player = game.players.find(p => p.userId.toString() === req.user._id.toString());
      const spectator = game.spectators.find(s => s.userId.toString() === req.user._id.toString());
      
      return {
        id: game._id,
        name: game.name,
        category: game.category,
        finishedAt: game.finishedAt,
        winner: game.winner ? {
          username: game.winner.username,
          avatar: game.winner.avatar
        } : null,
        playerStats: player ? {
          position: game.leaderboard.find(l => l.userId.toString() === req.user._id.toString())?.position || null,
          score: player.score,
          correctAnswers: player.answers.filter(a => a.isCorrect).length,
          totalQuestions: player.answers.length,
          role: 'player'
        } : { role: 'spectator' },
        totalPlayers: game.players.length
      };
    });

    const total = await Game.countDocuments({
      $or: [
        { 'players.userId': req.user._id },
        { 'spectators.userId': req.user._id }
      ],
      status: 'finished'
    });

    res.json({
      games: gameHistory,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Erreur historique parties:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques générales des parties
router.get('/stats/general', async (req, res) => {
  try {
    const stats = await Promise.all([
      Game.countDocuments({ status: 'waiting' }),
      Game.countDocuments({ status: 'playing' }),
      Game.countDocuments({ status: 'finished' }),
      Game.aggregate([
        { $match: { status: 'finished' } },
        { $group: { _id: null, avgPlayers: { $avg: '$gameStats.totalPlayers' } } }
      ])
    ]);

    res.json({
      waiting: stats[0],
      playing: stats[1],
      finished: stats[2],
      averagePlayersPerGame: Math.round(stats[3][0]?.avgPlayers || 0)
    });

  } catch (error) {
    logger.error('Erreur stats générales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;