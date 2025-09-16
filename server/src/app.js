const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const connectDB = require('./config/database')
const socketHandler = require('./socket/socketHandler')
const logger = require('./utils/logger')

// Import routes
const authRoutes = require('./routes/auth')
const gameRoutes = require('./routes/game')
const adminRoutes = require('./routes/admin')
const userRoutes = require('./routes/user')
const questionRoutes = require('./routes/question')

const app = express()
const server = http.createServer(app)

// CORS configuration (autorise plusieurs origines, y compris IP locale)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']

const corsOptions = {
  origin: function (origin, callback) {
    // Autorise les requêtes sans origin (ex : curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS: ' + origin))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Socket.IO setup (reprend la même logique CORS que l'API)
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Middlewares
app.use(helmet())
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
})
app.use('/api/', limiter)

// Connect to database
connectDB()

// Socket.IO handler
socketHandler(io)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/user', userRoutes)
app.use('/api/question', questionRoutes)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(500).json({
    error: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur le port ${PORT}`)
  logger.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`✅ CORS autorise: ${allowedOrigins.join(', ')}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux du serveur...')
  server.close(() => {
    logger.info('Serveur fermé.')
    process.exit(0)
  })
})

module.exports = app