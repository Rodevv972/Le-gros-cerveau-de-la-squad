const mongoose = require('mongoose')
const logger = require('../utils/logger')

const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  // Log la variable d'environnement utilisée
  logger.info(`🔎 MONGODB_URI utilisé : ${uri}`)

  if (!uri) {
    logger.error('❌ MONGODB_URI est undefined ! Vérifiez votre fichier .env et son chargement.')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    logger.info(`🗄️ MongoDB connectée: ${conn.connection.host}`)

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      logger.error('Erreur MongoDB:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnectée')
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnectée')
    })

  } catch (error) {
    logger.error('Erreur de connexion MongoDB:', error)
    // Détache les listeners pour éviter les fuites de mémoire en cas d'échec
    mongoose.connection.removeAllListeners()
    process.exit(1)
  }
}

module.exports = connectDB