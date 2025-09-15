const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Profil utilisateur
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      stats: user.stats,
      badges: user.badges,
      gameHistory: user.gameHistory.slice(-10), // 10 dernières parties
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });

  } catch (error) {
    logger.error('Erreur profil utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.patch('/profile', auth, async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updateData = {};

    if (username) {
      // Vérifier que le nom d'utilisateur n'est pas déjà pris
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      }
      
      updateData.username = username;
    }

    if (avatar) {
      updateData.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });

    logger.info(`Profil mis à jour: ${user.username}`);

  } catch (error) {
    logger.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques personnelles
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('stats gameHistory badges');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Calculer des statistiques supplémentaires
    const recentGames = user.gameHistory.slice(-10);
    const recentWins = recentGames.filter(game => game.position === 1).length;
    const recentAvgScore = recentGames.length > 0 
      ? recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length 
      : 0;

    // Statistiques par catégorie (nécessiterait une requête plus complexe)
    // Pour l'instant, on retourne les stats de base

    res.json({
      globalStats: user.stats,
      recentPerformance: {
        games: recentGames.length,
        wins: recentWins,
        winRate: recentGames.length > 0 ? (recentWins / recentGames.length * 100).toFixed(1) : 0,
        averageScore: Math.round(recentAvgScore)
      },
      badges: user.badges,
      achievements: {
        totalBadges: user.badges.length,
        recentBadges: user.badges.slice(-3)
      }
    });

  } catch (error) {
    logger.error('Erreur stats utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Classement global
router.get('/leaderboard', async (req, res) => {
  try {
    const period = req.query.period || 'all'; // all, weekly, monthly
    const limit = parseInt(req.query.limit) || 50;

    let dateFilter = {};
    
    if (period === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.lastLogin = { $gte: weekAgo };
    } else if (period === 'monthly') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter.lastLogin = { $gte: monthAgo };
    }

    const users = await User.find({ 
      isActive: true,
      'stats.totalGames': { $gt: 0 },
      ...dateFilter
    })
    .select('username avatar stats')
    .sort({ 'stats.totalScore': -1 })
    .limit(limit);

    const leaderboard = users.map((user, index) => ({
      position: index + 1,
      username: user.username,
      avatar: user.avatar,
      totalScore: user.stats.totalScore,
      totalGames: user.stats.totalGames,
      totalWins: user.stats.totalWins,
      winRate: user.stats.totalGames > 0 
        ? ((user.stats.totalWins / user.stats.totalGames) * 100).toFixed(1)
        : 0,
      averageScore: user.stats.totalGames > 0
        ? Math.round(user.stats.totalScore / user.stats.totalGames)
        : 0
    }));

    res.json({
      period,
      leaderboard,
      total: users.length
    });

  } catch (error) {
    logger.error('Erreur classement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rechercher des utilisateurs
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Terme de recherche trop court' });
    }

    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username avatar stats.totalScore stats.totalGames')
    .limit(parseInt(limit))
    .sort({ 'stats.totalScore': -1 });

    const results = users.map(user => ({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      totalScore: user.stats.totalScore,
      totalGames: user.stats.totalGames
    }));

    res.json({
      query: q,
      results,
      total: results.length
    });

  } catch (error) {
    logger.error('Erreur recherche utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les badges disponibles
router.get('/badges/available', (req, res) => {
  // Liste des badges disponibles (définis statiquement pour l'instant)
  const availableBadges = [
    {
      badgeId: 'first_win',
      name: 'Première Victoire',
      description: 'Remporter sa première partie',
      icon: '🏆'
    },
    {
      badgeId: 'perfect_score',
      name: 'Score Parfait',
      description: 'Répondre correctement à toutes les questions d\'une partie',
      icon: '⭐'
    },
    {
      badgeId: 'speed_demon',
      name: 'Démon de Vitesse',
      description: 'Répondre en moins de 3 secondes en moyenne',
      icon: '⚡'
    },
    {
      badgeId: 'scientist',
      name: 'Scientifique',
      description: 'Gagner 10 parties en sciences',
      icon: '🔬'
    },
    {
      badgeId: 'mathematician',
      name: 'Mathématicien',
      description: 'Répondre correctement à 50 questions de mathématiques',
      icon: '📐'
    },
    {
      badgeId: 'streak_master',
      name: 'Maître des Séries',
      description: 'Obtenir une série de 20 bonnes réponses consécutives',
      icon: '🔥'
    },
    {
      badgeId: 'veteran',
      name: 'Vétéran',
      description: 'Jouer 100 parties',
      icon: '🎖️'
    },
    {
      badgeId: 'champion',
      name: 'Champion',
      description: 'Gagner 25 parties',
      icon: '👑'
    }
  ];

  res.json({ badges: availableBadges });
});

module.exports = router;