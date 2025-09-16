const axios = require('axios');
const Question = require('../models/Question');
const logger = require('../utils/logger');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || 'pplx-7b-chat';

class PerplexityService {
  constructor() {
    this.model = PERPLEXITY_MODEL;
    this.apiUrl = 'https://api.perplexity.ai/v1/chat/completions';
  }

  /**
   * Génère des questions de quiz scientifique via Perplexity
   * @param {string} category - Catégorie scientifique
   * @param {number} count - Nombre de questions à générer
   * @param {string} difficulty - Niveau de difficulté
   * @returns {Promise<Array>} Questions générées
   */
  async generateQuestions(category = 'general', count = 1, difficulty = 'medium') {
    try {
      const prompt = this.buildPrompt(category, difficulty, count);

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en sciences qui crée des questions de quiz éducatives et précises. Réponds uniquement en JSON valide.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const completion = response.data;
      const answerContent = completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text;
      const questionsData = JSON.parse(answerContent);

      // Valider et formater les questions
      const formattedQuestions = this.validateAndFormatQuestions(questionsData.questions, category);

      // Sauvegarder les questions en base
      const savedQuestions = [];
      for (const questionData of formattedQuestions) {
        try {
          const question = new Question({
            ...questionData,
            source: 'perplexity',
            approved: true
          });
          await question.save();
          savedQuestions.push(question);
        } catch (error) {
          logger.error('Erreur sauvegarde question:', error);
        }
      }

      return savedQuestions;

    } catch (error) {
      logger.error('Erreur génération questions Perplexity:', error.response?.data || error.message || error);
      throw new Error('Erreur lors de la génération des questions');
    }
  }

  /**
   * Construit le prompt pour Perplexity
   */
  buildPrompt(category, difficulty, count) {
    const categoryNames = {
      physics: 'physique',
      chemistry: 'chimie',
      biology: 'biologie',
      mathematics: 'mathématiques',
      astronomy: 'astronomie',
      geology: 'géologie',
      general: 'sciences générales'
    };

    const difficultyNames = {
      easy: 'niveau débutant',
      medium: 'niveau intermédiaire',
      hard: 'niveau avancé'
    };

    return `Génère ${count} question(s) de quiz en ${categoryNames[category] || 'sciences'} de ${difficultyNames[difficulty] || 'niveau intermédiaire'}.

Critères:
- Questions en français
- Exactement 4 options de réponse (A, B, C, D)
- Une seule réponse correcte
- Questions précises et scientifiquement exactes
- Explication détaillée de la bonne réponse
- Éviter les questions trop techniques ou obscures

Format de réponse JSON:
{
  "questions": [
    {
      "question": "Texte de la question ?",
      "options": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false},
        {"text": "Option D", "isCorrect": false}
      ],
      "explanation": "Explication détaillée de pourquoi la réponse B est correcte...",
      "category": "${category}",
      "difficulty": "${difficulty}",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;
  }

  /**
   * Valide et formate les questions reçues de Perplexity
   */
  validateAndFormatQuestions(questions, category) {
    return questions.filter(q => {
      // Vérifier la structure de base
      if (!q.question || !q.options || !q.explanation) {
        logger.warn('Question mal formatée ignorée:', q);
        return false;
      }

      // Vérifier qu'il y a 4 options
      if (q.options.length !== 4) {
        logger.warn('Question avec mauvais nombre d\'options ignorée:', q);
        return false;
      }

      // Vérifier qu'il y a exactement une bonne réponse
      const correctAnswers = q.options.filter(opt => opt.isCorrect);
      if (correctAnswers.length !== 1) {
        logger.warn('Question avec mauvais nombre de bonnes réponses ignorée:', q);
        return false;
      }

      return true;
    }).map(q => ({
      ...q,
      category: q.category || category,
      tags: q.tags || [],
      difficulty: q.difficulty || 'medium'
    }));
  }

  /**
   * Génère une explication personnalisée pour une réponse
   */
  async generateExplanation(question, userAnswer, correctAnswer) {
    try {
      const prompt = `
Question: ${question}
Réponse de l'utilisateur: ${userAnswer}
Bonne réponse: ${correctAnswer}

Génère une explication courte et bienveillante (maximum 100 mots) qui:
- Explique pourquoi la bonne réponse est correcte
- Si la réponse utilisateur est fausse, explique pourquoi sans être condescendant
- Donne une information scientifique intéressante en rapport

Réponds uniquement avec le texte de l'explication, sans formatage.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un professeur de sciences bienveillant qui explique les concepts de manière claire et encourageante.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const completion = response.data;
      const answerContent = completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text;
      return answerContent?.trim() || 'Explication non disponible pour le moment.';

    } catch (error) {
      logger.error('Erreur génération explication:', error.response?.data || error.message || error);
      return 'Explication non disponible pour le moment.';
    }
  }

  /**
   * Valide une question suggérée par un utilisateur
   */
  async validateUserQuestion(questionData) {
    try {
      const prompt = `
Analyse cette question de quiz et détermine si elle est:
1. Scientifiquement correcte
2. Bien formulée
3. Appropriée pour un quiz éducatif
4. A exactement une bonne réponse parmi les 4 options

Question: ${questionData.question}
Options:
A) ${questionData.options[0]?.text}
B) ${questionData.options[1]?.text}
C) ${questionData.options[2]?.text}
D) ${questionData.options[3]?.text}

Réponse correcte indiquée: ${questionData.options.find(o => o.isCorrect)?.text}

Réponds avec ce format JSON:
{
  "isValid": true/false,
  "issues": ["problème1", "problème2"],
  "suggestions": "Suggestions d'amélioration",
  "confidence": 0.8
}`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert scientifique qui valide la qualité et l\'exactitude des questions de quiz.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const completion = response.data;
      const answerContent = completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text;
      return JSON.parse(answerContent);

    } catch (error) {
      logger.error('Erreur validation question:', error.response?.data || error.message || error);
      return {
        isValid: false,
        issues: ['Erreur lors de la validation'],
        suggestions: 'Validation manuelle requise',
        confidence: 0
      };
    }
  }
}

module.exports = new PerplexityService();