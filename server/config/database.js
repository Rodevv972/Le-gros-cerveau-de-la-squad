const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`🗄️ MongoDB connectée: ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      logger.error('Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnectée');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnectée');
    });

  } catch (error) {
    logger.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;