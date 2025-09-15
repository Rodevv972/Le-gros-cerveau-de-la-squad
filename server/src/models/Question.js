const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  explanation: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['openai', 'admin', 'user_suggestion'],
    default: 'openai'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  usageCount: {
    type: Number,
    default: 0
  },
  correctAnswerRate: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour les recherches
questionSchema.index({ category: 1, approved: 1, isActive: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });

// Validation pour s'assurer qu'il y a exactement une bonne réponse
questionSchema.pre('save', function(next) {
  const correctAnswers = this.options.filter(option => option.isCorrect);
  
  if (correctAnswers.length !== 1) {
    return next(new Error('Une question doit avoir exactement une bonne réponse'));
  }
  
  if (this.options.length !== 4) {
    return next(new Error('Une question doit avoir exactement 4 options'));
  }
  
  next();
});

// Méthode pour obtenir la bonne réponse
questionSchema.methods.getCorrectAnswer = function() {
  return this.options.find(option => option.isCorrect);
};

// Méthode pour mettre à jour les statistiques d'utilisation
questionSchema.methods.updateUsageStats = function(responseData) {
  this.usageCount += 1;
  
  // Mise à jour du taux de bonnes réponses
  const totalCorrect = responseData.totalCorrect || 0;
  const totalAnswers = responseData.totalAnswers || 1;
  
  this.correctAnswerRate = (this.correctAnswerRate * (this.usageCount - 1) + (totalCorrect / totalAnswers)) / this.usageCount;
  
  // Mise à jour du temps de réponse moyen
  if (responseData.averageTime) {
    this.averageResponseTime = (this.averageResponseTime * (this.usageCount - 1) + responseData.averageTime) / this.usageCount;
  }
};

module.exports = mongoose.model('Question', questionSchema);