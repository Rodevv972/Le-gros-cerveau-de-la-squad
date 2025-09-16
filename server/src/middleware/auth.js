const jwt = require('jsonwebtoken')
const User = require('../models/User')
const logger = require('../utils/logger')

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'Accès refusé, token manquant' })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Token invalide ou utilisateur inactif' })
    }
    
    req.user = user
    next()
  } catch (error) {
    logger.error('Erreur authentification:', error)
    res.status(401).json({ error: 'Token invalide' })
  }
}

// Middleware admin
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé, droits administrateur requis' })
    }
    next()
  } catch (error) {
    logger.error('Erreur authentification admin:', error)
    res.status(403).json({ error: 'Accès refusé' })
  }
}

// Middleware optionnel (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select('-password')
      
      if (user && user.isActive) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    // On ignore les erreurs pour l'auth optionnelle
    next()
  }
}

// Fonction pour générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )
}

module.exports = {
  auth,
  adminAuth,
  optionalAuth,
  generateToken
}