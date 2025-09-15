const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, avatar } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = new User({
      username,
      email,
      password,
      avatar: avatar || '🧠'
    });

    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    // Réponse (sans le mot de passe)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      stats: user.stats
    };

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userResponse,
      token
    });

    logger.info(`Nouvel utilisateur enregistré: ${username}`);

  } catch (error) {
    logger.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    // Réponse (sans le mot de passe)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      stats: user.stats,
      badges: user.badges
    };

    res.json({
      message: 'Connexion réussie',
      user: userResponse,
      token
    });

    logger.info(`Utilisateur connecté: ${user.username}`);

  } catch (error) {
    logger.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utilisateur invalide' });
    }

    // Générer un nouveau token
    const newToken = generateToken(user._id);

    res.json({
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats
      }
    });

  } catch (error) {
    logger.error('Erreur refresh token:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
});

// Logout (côté client principalement)
router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;