const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const logger = require('../utils/logger');

// Store active games and connections
const activeGames = new Map();
const userConnections = new Map();

module.exports = (io) => {
  // Middleware d'authentification Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token manquant'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Utilisateur invalide'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Erreur auth Socket.IO:', error);
      next(new Error('Authentification échouée'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Utilisateur connecté: ${socket.user.username} (${socket.id})`);
    
    // Stocker la connexion
    userConnections.set(socket.user._id.toString(), socket.id);
    
    // Rejoindre le lobby général
    socket.join('lobby');
    
    // Envoyer les parties disponibles
    socket.emit('availableGames', getAvailableGames());

    // === GESTION DES PARTIES ===
    
    // Créer une nouvelle partie (admin uniquement)
    socket.on('createGame', async (gameData) => {
      try {
        if (socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Seuls les admins peuvent créer des parties' });
          return;
        }

        const game = new Game({
          name: gameData.name,
          category: gameData.category,
          maxPlayers: gameData.maxPlayers || 50,
          createdBy: socket.user._id,
          questions: gameData.questions || []
        });

        await game.save();
        activeGames.set(game._id.toString(), game);

        socket.emit('gameCreated', { gameId: game._id });
        io.to('lobby').emit('newGameAvailable', formatGameForLobby(game));
        
        logger.info(`Partie créée: ${game.name} par ${socket.user.username}`);
      } catch (error) {
        logger.error('Erreur création partie:', error);
        socket.emit('error', { message: 'Erreur lors de la création de la partie' });
      }
    });

    // Rejoindre une partie
    socket.on('joinGame', async (gameId) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partie non trouvée' });
          return;
        }

        if (game.status !== 'waiting') {
          // Rejoindre en tant que spectateur
          game.addSpectator(socket.user);
          await game.save();
          
          socket.join(`game_${gameId}`);
          socket.gameId = gameId;
          socket.isSpectator = true;
          
          socket.emit('joinedAsSpectator', {
            game: formatGameForPlayer(game),
            currentQuestion: game.currentQuestionIndex < game.questions.length ? 
              await formatCurrentQuestion(game) : null
          });
          
          socket.to(`game_${gameId}`).emit('spectatorJoined', {
            username: socket.user.username,
            avatar: socket.user.avatar
          });
        } else {
          // Rejoindre en tant que joueur
          game.addPlayer(socket.user);
          await game.save();
          
          socket.join(`game_${gameId}`);
          socket.gameId = gameId;
          socket.isSpectator = false;
          
          socket.emit('joinedGame', { game: formatGameForPlayer(game) });
          socket.to(`game_${gameId}`).emit('playerJoined', {
            username: socket.user.username,
            avatar: socket.user.avatar,
            totalPlayers: game.players.length
          });
          
          // Mettre à jour le lobby
          io.to('lobby').emit('gameUpdated', formatGameForLobby(game));
        }
        
        activeGames.set(gameId, game);
        
      } catch (error) {
        logger.error('Erreur rejoindre partie:', error);
        socket.emit('error', { message: error.message || 'Erreur lors de la connexion à la partie' });
      }
    });

    // Démarrer une partie (admin uniquement)
    socket.on('startGame', async (gameId) => {
      try {
        if (socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Seuls les admins peuvent démarrer une partie' });
          return;
        }

        const game = await Game.findById(gameId).populate('questions');
        if (!game) {
          socket.emit('error', { message: 'Partie non trouvée' });
          return;
        }

        if (game.players.length < 2) {
          socket.emit('error', { message: 'Au moins 2 joueurs requis pour démarrer' });
          return;
        }

        game.status = 'playing';
        game.startedAt = new Date();
        await game.save();

        activeGames.set(gameId, game);

        io.to(`game_${gameId}`).emit('gameStarted', {
          message: 'La partie commence !',
          totalQuestions: game.questions.length
        });

        // Démarrer la première question après 3 secondes
        setTimeout(() => {
          startNextQuestion(gameId);
        }, 3000);

        logger.info(`Partie démarrée: ${game.name}`);
      } catch (error) {
        logger.error('Erreur démarrage partie:', error);
        socket.emit('error', { message: 'Erreur lors du démarrage de la partie' });
      }
    });

    // Répondre à une question
    socket.on('submitAnswer', async (data) => {
      try {
        const { gameId, questionId, selectedOption, responseTime } = data;
        
        if (socket.isSpectator) {
          socket.emit('error', { message: 'Les spectateurs ne peuvent pas répondre' });
          return;
        }

        const game = await Game.findById(gameId).populate('questions');
        if (!game || game.status !== 'playing') {
          socket.emit('error', { message: 'Partie non valide' });
          return;
        }

        const player = game.players.find(p => p.userId.toString() === socket.user._id.toString());
        if (!player || !player.isActive) {
          socket.emit('error', { message: 'Joueur non actif' });
          return;
        }

        const question = game.questions.find(q => q._id.toString() === questionId);
        if (!question) {
          socket.emit('error', { message: 'Question non trouvée' });
          return;
        }

        const isCorrect = question.options[selectedOption]?.isCorrect || false;
        const score = isCorrect ? game.calculateScore(responseTime, true) : 0;

        // Enregistrer la réponse
        player.answers.push({
          questionId,
          selectedOption,
          isCorrect,
          responseTime,
          answeredAt: new Date()
        });

        if (isCorrect) {
          player.score += score;
        } else {
          game.removeLife(socket.user._id);
        }

        player.lastAnswerTime = new Date();
        await game.save();

        // Confirmer la réponse au joueur
        socket.emit('answerSubmitted', {
          isCorrect,
          score,
          totalScore: player.score,
          lives: player.lives,
          correctAnswer: question.getCorrectAnswer()
        });

        // Si le joueur est éliminé
        if (player.lives <= 0) {
          socket.isSpectator = true;
          socket.emit('eliminated', { message: 'Vous avez été éliminé ! Vous pouvez continuer à regarder.' });
          socket.to(`game_${gameId}`).emit('playerEliminated', {
            username: player.username,
            finalScore: player.score
          });
        }

        activeGames.set(gameId, game);

      } catch (error) {
        logger.error('Erreur soumission réponse:', error);
        socket.emit('error', { message: 'Erreur lors de la soumission de la réponse' });
      }
    });

    // === GESTION DE LA DÉCONNEXION ===
    
    socket.on('disconnect', () => {
      logger.info(`Utilisateur déconnecté: ${socket.user.username} (${socket.id})`);
      
      // Retirer de la map des connexions
      userConnections.delete(socket.user._id.toString());
      
      // Si le joueur était dans une partie
      if (socket.gameId) {
        socket.to(`game_${socket.gameId}`).emit('playerLeft', {
          username: socket.user.username,
          isSpectator: socket.isSpectator
        });
      }
    });

    // === ÉVÉNEMENTS ADMIN ===
    
    socket.on('getGameStats', async (gameId) => {
      if (socket.user.role !== 'admin') return;
      
      try {
        const game = await Game.findById(gameId);
        if (game) {
          socket.emit('gameStats', {
            totalPlayers: game.players.length,
            activePlayers: game.players.filter(p => p.isActive && !p.isSpectator).length,
            spectators: game.spectators.length,
            currentQuestion: game.currentQuestionIndex + 1,
            totalQuestions: game.questions.length,
            leaderboard: game.leaderboard.slice(0, 10)
          });
        }
      } catch (error) {
        logger.error('Erreur stats partie:', error);
      }
    });
  });

  // === FONCTIONS UTILITAIRES ===

  function getAvailableGames() {
    const games = [];
    for (const [gameId, game] of activeGames) {
      if (game.status === 'waiting') {
        games.push(formatGameForLobby(game));
      }
    }
    return games;
  }

  function formatGameForLobby(game) {
    return {
      id: game._id,
      name: game.name,
      category: game.category,
      currentPlayers: game.players.length,
      maxPlayers: game.maxPlayers,
      status: game.status,
      createdAt: game.createdAt
    };
  }

  function formatGameForPlayer(game) {
    return {
      id: game._id,
      name: game.name,
      category: game.category,
      status: game.status,
      players: game.players.map(p => ({
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        lives: p.lives,
        isActive: p.isActive
      })),
      spectators: game.spectators.map(s => ({
        username: s.username,
        avatar: s.avatar
      })),
      leaderboard: game.leaderboard,
      currentQuestionIndex: game.currentQuestionIndex,
      totalQuestions: game.questions.length,
      settings: game.settings
    };
  }

  async function formatCurrentQuestion(game) {
    if (game.currentQuestionIndex >= game.questions.length) return null;
    
    const question = game.questions[game.currentQuestionIndex];
    return {
      id: question._id,
      question: question.question,
      options: question.options.map((opt, index) => ({
        index,
        text: opt.text
      })),
      timeLimit: game.settings.questionTimer
    };
  }

  async function startNextQuestion(gameId) {
    try {
      const game = await Game.findById(gameId).populate('questions');
      if (!game || game.status !== 'playing') return;

      if (game.currentQuestionIndex >= game.questions.length) {
        // Fin de partie
        game.finishGame();
        await game.save();
        
        io.to(`game_${gameId}`).emit('gameFinished', {
          winner: game.winner,
          leaderboard: game.leaderboard,
          stats: game.gameStats
        });
        
        activeGames.delete(gameId);
        return;
      }

      const question = await formatCurrentQuestion(game);
      if (!question) return;

      // Envoyer la question
      io.to(`game_${gameId}`).emit('newQuestion', {
        question,
        questionNumber: game.currentQuestionIndex + 1,
        totalQuestions: game.questions.length
      });

      // Timer pour la question
      setTimeout(async () => {
        await endCurrentQuestion(gameId);
      }, game.settings.questionTimer * 1000);

    } catch (error) {
      logger.error('Erreur démarrage question:', error);
    }
  }

  async function endCurrentQuestion(gameId) {
    try {
      const game = await Game.findById(gameId).populate('questions');
      if (!game || game.status !== 'playing') return;

      const question = game.questions[game.currentQuestionIndex];
      
      // Montrer la bonne réponse
      io.to(`game_${gameId}`).emit('questionEnded', {
        correctAnswer: question.getCorrectAnswer(),
        explanation: question.explanation
      });

      // Mettre à jour le leaderboard
      game.updateLeaderboard();
      game.currentQuestionIndex += 1;
      await game.save();

      // Envoyer le leaderboard mis à jour
      io.to(`game_${gameId}`).emit('leaderboardUpdate', {
        leaderboard: game.leaderboard.slice(0, 10),
        activePlayers: game.players.filter(p => p.isActive && !p.isSpectator).length
      });

      // Vérifier si la partie est terminée
      if (game.isGameOver()) {
        game.finishGame();
        await game.save();
        
        io.to(`game_${gameId}`).emit('gameFinished', {
          winner: game.winner,
          leaderboard: game.leaderboard,
          stats: game.gameStats
        });
        
        activeGames.delete(gameId);
      } else {
        // Pause avant la prochaine question
        setTimeout(() => {
          startNextQuestion(gameId);
        }, 5000);
      }

      activeGames.set(gameId, game);

    } catch (error) {
      logger.error('Erreur fin question:', error);
    }
  }
};