# 🧠 Le Gros cerveau de la Squad

Un quiz sciences multijoueur en direct qui met à l'épreuve vos connaissances scientifiques dans des parties palpitantes en temps réel !

## 🎯 Fonctionnalités

### 🎮 Gameplay Principal
- **Quiz sciences en live** : Questions à choix multiples (QCM à 4 choix)
- **Timer de 15 secondes** : Répondez rapidement pour maximiser vos points
- **Système de vies** : 3 vies par joueur, élimination progressive
- **Mode spectateur** : Les joueurs éliminés peuvent continuer à suivre la partie
- **Parties multijoueurs** : Jusqu'à 50 joueurs simultanément
- **Génération de questions par IA** : Questions et explications générées via OpenAI
- **Classements en temps réel** : TOP 3 live et TOP 50 général

### 🛠️ Administration
- **Interface admin** : Création et gestion des parties
- **Dashboard en temps réel** : Statistiques live, nombre de joueurs, alertes
- **Gestion des questions** : Ajout, modification, validation des questions
- **Contrôle des parties** : Lancement, pause, gestion du déroulement

### 🏆 Fonctionnalités Avancées
- **Système de badges** : Débloquez des réalisations (série de bonnes réponses, records...)
- **Historique personnel** : Consultez vos performances et votre progression
- **Statistiques détaillées** : Analyse par thème, vitesse de réponse, ratios
- **Classements multiples** : Hebdomadaire, mensuel, général
- **Export des données** : Résultats et statistiques en CSV (admin)
- **Suggestions de questions** : Les joueurs peuvent proposer des questions
- **Validation automatique** : Questions validées par l'IA et les admins

## 🏗️ Architecture

### Monorepo Structure
```
Le-gros-cerveau-de-la-squad/
├── server/          # Backend Node.js
├── client/          # Frontend React
├── docs/            # Documentation
├── docker-compose.yml
├── package.json     # Scripts workspace
└── README.md
```

### 🛠️ Stack Technique

#### Backend (`/server`)
- **Node.js** + **Express.js** - Serveur API REST
- **Socket.IO** - Communication temps réel
- **MongoDB** + **Mongoose** - Base de données et ODM
- **OpenAI API** - Génération de questions par IA
- **JWT** - Authentification
- **bcryptjs** - Hachage des mots de passe
- **Winston** - Logging
- **Docker** - Containerisation

#### Frontend (`/client`)
- **React 18** + **Vite** - Interface utilisateur moderne
- **Material-UI** - Composants et thème
- **Socket.IO Client** - Temps réel côté client
- **React Router** - Navigation
- **React Query** - Gestion des données
- **Axios** - Requêtes HTTP
- **React Hook Form** - Gestion des formulaires

## 🚀 Installation et Démarrage

### Prérequis
- **Node.js** 16+ 
- **MongoDB** (local ou Atlas)
- **Clé API OpenAI** (pour la génération de questions)

### 1. Cloner le projet
```bash
git clone https://github.com/Rodevv972/Le-gros-cerveau-de-la-squad.git
cd Le-gros-cerveau-de-la-squad
```

### 2. Configuration des variables d'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos informations
nano .env
```

**Variables requises :**
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/quiz_app

# Authentification
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Configuration serveur
PORT=3001
NODE_ENV=development
```

### 3. Installation des dépendances
```bash
# Installer les dépendances du workspace
npm install

# Installer les dépendances du serveur
cd server && npm install && cd ..

# Installer les dépendances du client
cd client && npm install && cd ..
```

### 4. Démarrage en développement
```bash
# Option 1: Démarrer tout en une fois (recommandé)
npm run dev

# Option 2: Démarrer séparément
# Terminal 1: Serveur
npm run server:dev

# Terminal 2: Client  
npm run client:dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:3001
- **API** : http://localhost:3001/api

### 5. Déploiement avec Docker
```bash
# Construire et démarrer tous les services
npm run docker:up

# Arrêter les services
npm run docker:down
```

## 📝 Scripts Disponibles

### Workspace (racine)
```bash
npm run dev          # Démarre server + client en parallèle
npm run build        # Build les deux applications
npm run test         # Lance tous les tests
npm run lint         # Lint le code
```

### Serveur (`/server`)
```bash
npm start            # Démarre en production
npm run dev          # Démarre en mode développement
npm test             # Lance les tests
npm run lint         # ESLint
```

### Client (`/client`)
```bash
npm run dev          # Serveur de développement Vite
npm run build        # Build pour production
npm run preview      # Prévisualiser le build
npm test             # Tests (à implémenter)
```

## 🗃️ Structure de la Base de Données

### Collections MongoDB

#### Users
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  avatar: String (emoji),
  role: 'player' | 'admin',
  stats: {
    totalGames: Number,
    totalWins: Number,
    totalCorrectAnswers: Number,
    totalQuestions: Number,
    averageResponseTime: Number,
    currentStreak: Number,
    bestStreak: Number,
    totalScore: Number
  },
  badges: [BadgeObject],
  gameHistory: [GameHistoryObject]
}
```

#### Games
```javascript
{
  name: String,
  status: 'waiting' | 'playing' | 'finished',
  category: String,
  maxPlayers: Number,
  questions: [ObjectId],
  players: [PlayerObject],
  spectators: [SpectatorObject],
  leaderboard: [LeaderboardObject],
  settings: SettingsObject,
  createdBy: ObjectId,
  gameStats: StatsObject
}
```

#### Questions
```javascript
{
  question: String,
  options: [{text: String, isCorrect: Boolean}],
  explanation: String,
  category: String,
  difficulty: 'easy' | 'medium' | 'hard',
  source: 'openai' | 'admin' | 'user_suggestion',
  approved: Boolean,
  usageCount: Number,
  correctAnswerRate: Number
}
```

## 🔗 API Endpoints

### Authentification (`/api/auth`)
- `POST /login` - Connexion
- `POST /register` - Inscription
- `POST /logout` - Déconnexion
- `POST /refresh` - Renouveler le token

### Utilisateurs (`/api/user`)
- `GET /profile` - Profil utilisateur
- `PATCH /profile` - Modifier le profil
- `GET /stats` - Statistiques personnelles
- `GET /leaderboard` - Classement global

### Parties (`/api/game`)
- `GET /available` - Parties disponibles
- `GET /:gameId` - Détails d'une partie
- `POST /create` - Créer une partie (admin)
- `POST /:gameId/join` - Rejoindre une partie
- `GET /user/history` - Historique personnel

### Questions (`/api/question`)
- `GET /` - Liste des questions (filtrée)
- `POST /` - Créer une question (admin)
- `POST /suggest` - Suggérer une question
- `GET /categories` - Catégories disponibles
- `POST /generate-sample` - Exemple de génération IA

### Administration (`/api/admin`)
- `GET /dashboard` - Tableau de bord
- `GET /users` - Gestion des utilisateurs
- `GET /games` - Gestion des parties
- `GET /questions` - Gestion des questions
- `POST /questions/generate` - Générer des questions IA
- `GET /export/:type` - Export des données

## 🎮 Événements Socket.IO

### Client → Serveur
- `createGame` - Créer une partie
- `joinGame` - Rejoindre une partie
- `startGame` - Démarrer une partie
- `submitAnswer` - Soumettre une réponse
- `getGameStats` - Obtenir les stats live

### Serveur → Client
- `gameCreated` - Partie créée
- `joinedGame` - Partie rejointe (joueur)
- `joinedAsSpectator` - Partie rejointe (spectateur)
- `gameStarted` - Partie démarrée
- `newQuestion` - Nouvelle question
- `questionEnded` - Fin de question + réponse
- `answerSubmitted` - Confirmation de réponse
- `eliminated` - Joueur éliminé
- `gameFinished` - Fin de partie
- `leaderboardUpdate` - Mise à jour classement

## 🎨 Thèmes et Catégories

### Catégories Scientifiques
- 🔬 **Sciences Générales**
- ⚛️ **Physique**
- 🧪 **Chimie** 
- 🧬 **Biologie**
- 📐 **Mathématiques**
- 🌌 **Astronomie**
- 🌍 **Géologie**

### Badges Disponibles
- 🏆 **Première Victoire** - Remporter sa première partie
- ⭐ **Score Parfait** - Répondre correctement à toutes les questions
- ⚡ **Démon de Vitesse** - Temps de réponse moyen < 3s
- 🔬 **Scientifique** - Gagner 10 parties en sciences
- 📐 **Mathématicien** - 50 bonnes réponses en maths
- 🔥 **Maître des Séries** - 20 bonnes réponses consécutives
- 🎖️ **Vétéran** - Jouer 100 parties
- 👑 **Champion** - Gagner 25 parties

## 🔒 Sécurité

- **Authentification JWT** avec expiration
- **Hachage des mots de passe** avec bcrypt
- **Validation des données** côté serveur
- **Rate limiting** sur les API
- **CORS** configuré
- **Helmet.js** pour les en-têtes de sécurité
- **Validation des permissions** (admin/utilisateur)

## 🧪 Tests

```bash
# Tests serveur
cd server && npm test

# Tests client  
cd client && npm test

# Tests complets
npm test
```

## 📈 Monitoring et Logs

- **Winston** pour les logs serveur
- **Logs structurés** (JSON) en production
- **Métriques de performance** des parties
- **Statistiques d'utilisation** des questions
- **Alertes d'erreur** en temps réel

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une [issue](https://github.com/Rodevv972/Le-gros-cerveau-de-la-squad/issues)
- Contacter l'équipe de développement

## 🎯 Roadmap

### Version 1.0 (Actuelle)
- ✅ Structure complète du projet
- ✅ Authentification et gestion des utilisateurs
- ✅ Système de parties multijoueurs
- ✅ Génération de questions par IA
- ✅ Interface d'administration
- ✅ Déploiement Docker

### Version 1.1 (Prochaine)
- [ ] Interface de jeu complète avec timer
- [ ] Animations et effets visuels
- [ ] Système de notifications push
- [ ] Mode hors ligne pour les questions

### Version 1.2 (Future)
- [ ] Application mobile (React Native)
- [ ] Système de tournois
- [ ] Intégration réseaux sociaux
- [ ] Thèmes visuels personnalisables

---

**🧠 Développé avec passion par l'équipe Le Gros cerveau de la Squad**
