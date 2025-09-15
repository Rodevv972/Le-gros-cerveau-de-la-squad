const OpenAI = require('openai');
const Question = require('../models/Question');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class OpenAIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  /**
   * Génère des questions de quiz scientifique via OpenAI
   * @param {string} category - Catégorie scientifique
   * @param {number} count - Nombre de questions à générer
   * @param {string} difficulty - Niveau de difficulté
   * @returns {Promise<Array>} Questions générées
   */
  async generateQuestions(category = 'general', count = 1, difficulty = 'medium') {
    try {
      const prompt = this.buildPrompt(category, difficulty, count);
      
      const completion = await openai.chat.completions.create({
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
      });

      const response = completion.choices[0].message.content;
      const questionsData = JSON.parse(response);
      
      // Valider et formater les questions
      const formattedQuestions = this.validateAndFormatQuestions(questionsData.questions, category);
      
      // Sauvegarder les questions en base
      const savedQuestions = [];
      for (const questionData of formattedQuestions) {
        try {
          const question = new Question({
            ...questionData,
            source: 'openai',
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
      logger.error('Erreur génération questions OpenAI:', error);
      throw new Error('Erreur lors de la génération des questions');
    }
  }

  /**
   * Construit le prompt pour OpenAI
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
   * Valide et formate les questions reçues d'OpenAI
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

      const completion = await openai.chat.completions.create({
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
      });

      return completion.choices[0].message.content.trim();
      
    } catch (error) {
      logger.error('Erreur génération explication:', error);
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

      const completion = await openai.chat.completions.create({
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
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      logger.error('Erreur validation question:', error);
      return {
        isValid: false,
        issues: ['Erreur lors de la validation'],
        suggestions: 'Validation manuelle requise',
        confidence: 0
      };
    }
  }
}

module.exports = new OpenAIService();