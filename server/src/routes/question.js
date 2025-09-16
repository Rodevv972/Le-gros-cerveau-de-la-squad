const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');
const perplexityService = require('../services/perplexityService');
const logger = require('../utils/logger');

const router = express.Router();

// Obtenir des questions (pour les parties)
router.get('/', auth, async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      limit = 10, 
      exclude = [] 
    } = req.query;

    const filter = {
      approved: true,
      isActive: true
    };

    if (category && category !== 'mixed') {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (exclude.length > 0) {
      filter._id = { $nin: exclude };
    }

    const questions = await Question.find(filter)
      .sort({ usageCount: 1 }) // Privilégier les questions moins utilisées
      .limit(parseInt(limit));

    // Ne pas exposer la bonne réponse pour les questions actives
    const sanitizedQuestions = questions.map(q => ({
      id: q._id,
      question: q.question,
      options: q.options.map((opt, index) => ({
        index,
        text: opt.text
      })),
      category: q.category,
      difficulty: q.difficulty
    }));

    res.json({ questions: sanitizedQuestions });

  } catch (error) {
    logger.error('Erreur récupération questions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir une question spécifique avec la réponse (pour correction)
router.get('/:questionId/answer', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    const correctAnswer = question.getCorrectAnswer();
    
    res.json({
      questionId: question._id,
      correctAnswer: {
        index: question.options.findIndex(opt => opt.isCorrect),
        text: correctAnswer.text
      },
      explanation: question.explanation
    });

  } catch (error) {
    logger.error('Erreur récupération réponse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle question (admin)
router.post('/', auth, adminAuth, [
  body('question').notEmpty().withMessage('Question requise'),
  body('options').isArray({ min: 4, max: 4 }).withMessage('4 options requises'),
  body('explanation').notEmpty().withMessage('Explication requise'),
  body('category').isIn(['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general']).withMessage('Catégorie invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, options, explanation, category, difficulty, tags } = req.body;

    // Vérifier qu'il y a exactement une bonne réponse
    const correctAnswers = options.filter(opt => opt.isCorrect);
    if (correctAnswers.length !== 1) {
      return res.status(400).json({ error: 'Il doit y avoir exactement une bonne réponse' });
    }

    const newQuestion = new Question({
      question,
      options,
      explanation,
      category,
      difficulty: difficulty || 'medium',
      tags: tags || [],
      source: 'admin',
      createdBy: req.user._id,
      approved: true,
      approvedBy: req.user._id
    });

    await newQuestion.save();

    res.status(201).json({
      message: 'Question créée avec succès',
      question: {
        id: newQuestion._id,
        question: newQuestion.question,
        category: newQuestion.category,
        difficulty: newQuestion.difficulty
      }
    });

    logger.info(`Question créée par ${req.user.username}: ${newQuestion.question.substring(0, 50)}...`);

  } catch (error) {
    logger.error('Erreur création question:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la question' });
  }
});

// Suggérer une question (utilisateur)
router.post('/suggest', auth, [
  body('question').notEmpty().withMessage('Question requise'),
  body('options').isArray({ min: 4, max: 4 }).withMessage('4 options requises'),
  body('explanation').notEmpty().withMessage('Explication requise'),
  body('category').isIn(['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general']).withMessage('Catégorie invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, options, explanation, category, difficulty, tags } = req.body;

    // Vérifier qu'il y a exactement une bonne réponse
    const correctAnswers = options.filter(opt => opt.isCorrect);
    if (correctAnswers.length !== 1) {
      return res.status(400).json({ error: 'Il doit y avoir exactement une bonne réponse' });
    }

    // Validation par IA (optionnelle)
    let validationResult = null;
    try {
      validationResult = await openaiService.validateUserQuestion(req.body);
    } catch (error) {
      logger.warn('Échec validation IA question:', error);
    }

    const newQuestion = new Question({
      question,
      options,
      explanation,
      category,
      difficulty: difficulty || 'medium',
      tags: tags || [],
      source: 'user_suggestion',
      createdBy: req.user._id,
      approved: false // Les suggestions doivent être approuvées
    });

    await newQuestion.save();

    res.status(201).json({
      message: 'Question suggérée avec succès. Elle sera examinée par les modérateurs.',
      questionId: newQuestion._id,
      validation: validationResult
    });

    logger.info(`Question suggérée par ${req.user.username}: ${newQuestion.question.substring(0, 50)}...`);

  } catch (error) {
    logger.error('Erreur suggestion question:', error);
    res.status(500).json({ error: 'Erreur lors de la suggestion de question' });
  }
});

// Mettre à jour une question (admin)
router.patch('/:questionId', auth, adminAuth, async (req, res) => {
  try {
    const { question, options, explanation, category, difficulty, tags, isActive } = req.body;
    
    const questionDoc = await Question.findById(req.params.questionId);
    if (!questionDoc) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    // Validation si les options sont modifiées
    if (options) {
      const correctAnswers = options.filter(opt => opt.isCorrect);
      if (correctAnswers.length !== 1) {
        return res.status(400).json({ error: 'Il doit y avoir exactement une bonne réponse' });
      }
    }

    const updateData = {};
    if (question) updateData.question = question;
    if (options) updateData.options = options;
    if (explanation) updateData.explanation = explanation;
    if (category) updateData.category = category;
    if (difficulty) updateData.difficulty = difficulty;
    if (tags) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.questionId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Question mise à jour avec succès',
      question: {
        id: updatedQuestion._id,
        question: updatedQuestion.question,
        category: updatedQuestion.category,
        isActive: updatedQuestion.isActive
      }
    });

    logger.info(`Question ${req.params.questionId} mise à jour par ${req.user.username}`);

  } catch (error) {
    logger.error('Erreur mise à jour question:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Supprimer une question (admin)
router.delete('/:questionId', auth, adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    await Question.findByIdAndDelete(req.params.questionId);

    res.json({ message: 'Question supprimée avec succès' });

    logger.info(`Question ${req.params.questionId} supprimée par ${req.user.username}`);

  } catch (error) {
    logger.error('Erreur suppression question:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Obtenir les catégories disponibles
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'physics', name: 'Physique', icon: '⚛️' },
    { id: 'chemistry', name: 'Chimie', icon: '🧪' },
    { id: 'biology', name: 'Biologie', icon: '🧬' },
    { id: 'mathematics', name: 'Mathématiques', icon: '📐' },
    { id: 'astronomy', name: 'Astronomie', icon: '🌌' },
    { id: 'geology', name: 'Géologie', icon: '🌍' },
    { id: 'general', name: 'Sciences Générales', icon: '🔬' }
  ];

  res.json({ categories });
});

// Statistiques des questions
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          approved: { $sum: { $cond: ['$approved', 1, 0] } },
          avgUsage: { $avg: '$usageCount' },
          avgCorrectRate: { $avg: '$correctAnswerRate' }
        }
      }
    ]);

    const totalQuestions = await Question.countDocuments();
    const approvedQuestions = await Question.countDocuments({ approved: true });

    res.json({
      overview: {
        total: totalQuestions,
        approved: approvedQuestions,
        pending: totalQuestions - approvedQuestions
      },
      byCategory: stats.map(stat => ({
        category: stat._id,
        total: stat.total,
        approved: stat.approved,
        averageUsage: Math.round(stat.avgUsage || 0),
        averageCorrectRate: Math.round((stat.avgCorrectRate || 0) * 100)
      }))
    });

  } catch (error) {
    logger.error('Erreur stats questions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Générer des questions via OpenAI (endpoint public pour tests)
router.post('/generate-sample', [
  body('category').optional().isIn(['physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'geology', 'general']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category = 'general', difficulty = 'medium' } = req.body;

    // Générer une seule question d'exemple
    const questions = await openaiService.generateQuestions(category, 1, difficulty);

    if (questions.length === 0) {
      return res.status(500).json({ error: 'Aucune question générée' });
    }

    const sampleQuestion = questions[0];

    res.json({
      message: 'Question d\'exemple générée',
      question: {
        id: sampleQuestion._id,
        question: sampleQuestion.question,
        options: sampleQuestion.options.map((opt, index) => ({
          index,
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        explanation: sampleQuestion.explanation,
        category: sampleQuestion.category,
        difficulty: sampleQuestion.difficulty
      }
    });

  } catch (error) {
    logger.error('Erreur génération question exemple:', error);
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
});

module.exports = router;