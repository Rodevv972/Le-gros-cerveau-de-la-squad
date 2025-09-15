const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: '🧠'
  },
  role: {
    type: String,
    enum: ['player', 'admin'],
    default: 'player'
  },
  stats: {
    totalGames: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalCorrectAnswers: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 }
  },
  badges: [{
    badgeId: String,
    earnedAt: { type: Date, default: Date.now },
    name: String,
    description: String,
    icon: String
  }],
  gameHistory: [{
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    position: Number,
    score: Number,
    correctAnswers: Number,
    totalQuestions: Number,
    playedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour les recherches fréquentes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'stats.totalScore': -1 });

// Hash password avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour mettre à jour les statistiques
userSchema.methods.updateStats = function(gameData) {
  this.stats.totalGames += 1;
  this.stats.totalCorrectAnswers += gameData.correctAnswers;
  this.stats.totalQuestions += gameData.totalQuestions;
  
  if (gameData.position === 1) {
    this.stats.totalWins += 1;
  }
  
  // Mise à jour de la streak
  if (gameData.correctAnswers > 0) {
    this.stats.currentStreak += 1;
    if (this.stats.currentStreak > this.stats.bestStreak) {
      this.stats.bestStreak = this.stats.currentStreak;
    }
  } else {
    this.stats.currentStreak = 0;
  }
  
  // Calcul du temps de réponse moyen
  if (gameData.averageResponseTime) {
    const totalTime = this.stats.averageResponseTime * (this.stats.totalGames - 1);
    this.stats.averageResponseTime = (totalTime + gameData.averageResponseTime) / this.stats.totalGames;
  }
  
  this.stats.totalScore += gameData.score || 0;
};

// Méthode pour ajouter un badge
userSchema.methods.addBadge = function(badge) {
  const existingBadge = this.badges.find(b => b.badgeId === badge.badgeId);
  if (!existingBadge) {
    this.badges.push(badge);
  }
};

module.exports = mongoose.model('User', userSchema);