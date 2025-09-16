import React from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  Badge
} from '@mui/material'
import {
  Stars,
  EmojiEvents,
  SportsEsports,
  TrendingUp,
  School,
  Science,
  Calculate,
  Biotech,
  Psychology,
  LocalFireDepartment,
  Speed,
  GpsFixed
} from '@mui/icons-material'

const ProfilePage = () => {
  // Mock data pour les statistiques du joueur
  const playerStats = {
    username: "QuizMaster2024",
    avatar: "QM",
    level: 15,
    totalScore: 25450,
    totalGames: 127,
    wins: 89,
    winRate: 70.1,
    averageScore: 200.4,
    bestScore: 2890,
    streak: 8,
    totalQuestions: 1524,
    correctAnswers: 1143,
    accuracy: 75.0,
    favCategory: "physics",
    experiencePoints: 15820,
    nextLevelXP: 18000
  }

  const badges = [
    { id: 1, name: "Première Victoire", icon: <EmojiEvents />, color: "warning", earned: true },
    { id: 2, name: "Série de 5", icon: <LocalFireDepartment />, color: "error", earned: true },
    { id: 3, name: "Expert Physique", icon: <Science />, color: "primary", earned: true },
    { id: 4, name: "Mathématicien", icon: <Calculate />, color: "success", earned: true },
    { id: 5, name: "Rapidité", icon: <Speed />, color: "info", earned: true },
    { id: 6, name: "Précision", icon: <GpsFixed />, color: "secondary", earned: false },
    { id: 7, name: "Biologiste", icon: <Biotech />, color: "warning", earned: false },
    { id: 8, name: "Astronome", icon: <Psychology />, color: "info", earned: false }
  ]

  const recentGames = [
    { name: "Physique Quantique", score: 2340, position: 1, date: "Aujourd'hui" },
    { name: "Mathématiques", score: 1890, position: 3, date: "Hier" },
    { name: "Chimie", score: 2105, position: 2, date: "Il y a 2 jours" },
    { name: "Biologie", score: 1756, position: 5, date: "Il y a 3 jours" }
  ]

  const getPositionColor = (position) => {
    if (position === 1) return 'warning'
    if (position <= 3) return 'default'
    return 'default'
  }

  const getPositionIcon = (position) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `#${position}`
  }

  const getLevelProgress = () => {
    return ((playerStats.experiencePoints % 1000) / 1000) * 100
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          👤 Mon Profil
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Statistiques et réalisations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Informations du joueur */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, textAlign: 'center', height: 'fit-content' }}>
            <Badge
              badgeContent={playerStats.level}
              color="primary"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  margin: '0 auto',
                  mb: 2
                }}
              >
                {playerStats.avatar}
              </Avatar>
            </Badge>
            
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {playerStats.username}
            </Typography>
            
            <Typography variant="h6" color="primary.main" gutterBottom>
              Niveau {playerStats.level}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {playerStats.experiencePoints} / {playerStats.nextLevelXP} XP
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getLevelProgress()} 
                sx={{ height: 8, borderRadius: 4, mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Stars />} 
                label={`${playerStats.totalScore.toLocaleString()} pts`}
                color="warning"
                variant="outlined"
              />
              <Chip 
                icon={<EmojiEvents />} 
                label={`${playerStats.wins} victoires`}
                color="success"
                variant="outlined"
              />
            </Box>
          </Card>
        </Grid>

        {/* Statistiques détaillées */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Statistiques de jeu */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <SportsEsports sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {playerStats.totalGames}
                </Typography>
                <Typography color="text.secondary">
                  Parties jouées
                </Typography>
                <Typography variant="body2" color="success.main">
                  {playerStats.winRate}% de victoires
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {playerStats.averageScore}
                </Typography>
                <Typography color="text.secondary">
                  Score moyen
                </Typography>
                <Typography variant="body2" color="warning.main">
                  Record: {playerStats.bestScore}
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <LocalFireDepartment sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {playerStats.streak}
                </Typography>
                <Typography color="text.secondary">
                  Série actuelle
                </Typography>
                <Typography variant="body2" color="error.main">
                  🔥 En feu !
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <School sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {playerStats.accuracy}%
                </Typography>
                <Typography color="text.secondary">
                  Précision
                </Typography>
                <Typography variant="body2" color="info.main">
                  {playerStats.correctAnswers}/{playerStats.totalQuestions}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Badges et réalisations */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              🏆 Badges et Réalisations
            </Typography>
            <Grid container spacing={2}>
              {badges.map((badge) => (
                <Grid item xs={6} sm={4} md={3} key={badge.id}>
                  <Card 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      opacity: badge.earned ? 1 : 0.4,
                      border: badge.earned ? `2px solid` : '2px solid transparent',
                      borderColor: badge.earned ? `${badge.color}.main` : 'transparent',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box sx={{ color: `${badge.color}.main`, mb: 1 }}>
                      {badge.icon}
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {badge.name}
                    </Typography>
                    {badge.earned && (
                      <Chip 
                        label="Obtenu" 
                        color={badge.color}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>

        {/* Parties récentes */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              📊 Parties Récentes
            </Typography>
            <Grid container spacing={2}>
              {recentGames.map((game, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold" noWrap>
                        {game.name}
                      </Typography>
                      <Chip 
                        label={getPositionIcon(game.position)}
                        color={getPositionColor(game.position)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {game.score.toLocaleString()} pts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {game.date}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProfilePage