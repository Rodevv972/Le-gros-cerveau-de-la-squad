import React, { useState } from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Divider,
  Alert
} from '@mui/material'
import {
  Add,
  People,
  PlayArrow,
  Refresh,
  Science,
  Calculate,
  Biotech,
  Psychology
} from '@mui/icons-material'

const LobbyPage = () => {
  const [refreshing, setRefreshing] = useState(false)

  // Mock data pour les parties disponibles
  const availableGames = [
    {
      id: 1,
      name: "Physique Quantique",
      category: "physics",
      currentPlayers: 6,
      maxPlayers: 12,
      status: "waiting",
      createdBy: "Prof_Einstein",
      difficulty: "Expert",
      estimatedDuration: "15 min"
    },
    {
      id: 2,
      name: "Chimie Organique", 
      category: "chemistry",
      currentPlayers: 3,
      maxPlayers: 8,
      status: "waiting",
      createdBy: "Dr_Lavoisier",
      difficulty: "Intermédiaire",
      estimatedDuration: "12 min"
    },
    {
      id: 3,
      name: "Mathématiques Avancées",
      category: "mathematics", 
      currentPlayers: 8,
      maxPlayers: 10,
      status: "playing",
      createdBy: "Prof_Gauss",
      difficulty: "Expert",
      estimatedDuration: "20 min"
    },
    {
      id: 4,
      name: "Biologie Cellulaire",
      category: "biology",
      currentPlayers: 2,
      maxPlayers: 15,
      status: "waiting", 
      createdBy: "Dr_Darwin",
      difficulty: "Débutant",
      estimatedDuration: "10 min"
    },
    {
      id: 5,
      name: "Astronomie",
      category: "astronomy",
      currentPlayers: 12,
      maxPlayers: 12,
      status: "playing",
      createdBy: "Prof_Hubble",
      difficulty: "Intermédiaire", 
      estimatedDuration: "18 min"
    }
  ]

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'physics': return <Science />
      case 'chemistry': return <Science />
      case 'mathematics': return <Calculate />
      case 'biology': return <Biotech />
      case 'astronomy': return <Psychology />
      default: return <Science />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'physics': return 'primary'
      case 'chemistry': return 'secondary'
      case 'mathematics': return 'success'
      case 'biology': return 'warning'
      case 'astronomy': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status) => {
    return status === 'waiting' ? 'success' : 'warning'
  }

  const getStatusLabel = (status) => {
    return status === 'waiting' ? 'En attente' : 'En cours'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Débutant': return 'success'
      case 'Intermédiaire': return 'warning'
      case 'Expert': return 'error'
      default: return 'default'
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleJoinGame = (gameId) => {
    console.log(`Rejoindre la partie ${gameId}`)
    // Ici on ferait la logique pour rejoindre la partie
  }

  const handleWatchGame = (gameId) => {
    console.log(`Observer la partie ${gameId}`)
    // Ici on ferait la logique pour observer la partie
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          🎮 Lobby des Parties
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Choisissez une partie ou attendez qu'un admin en lance une !
        </Typography>
      </Box>

      {/* Actions rapides */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
        >
          Créer une partie
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          size="large"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </Box>

      {/* Statistiques rapides */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography>
          📊 <strong>{availableGames.length}</strong> parties disponibles - 
          <strong> {availableGames.filter(g => g.status === 'waiting').length}</strong> en attente de joueurs - 
          <strong> {availableGames.filter(g => g.status === 'playing').length}</strong> en cours
        </Typography>
      </Alert>

      {/* Liste des parties */}
      <Grid container spacing={3}>
        {availableGames.map((game) => (
          <Grid item xs={12} md={6} lg={4} key={game.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* En-tête de la carte */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getCategoryIcon(game.category)}
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {game.name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={getStatusLabel(game.status)}
                    color={getStatusColor(game.status)}
                    size="small"
                  />
                </Box>

                {/* Informations de la partie */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Créée par <strong>{game.createdBy}</strong>
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={game.category} 
                      color={getCategoryColor(game.category)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={game.difficulty}
                      color={getDifficultyColor(game.difficulty)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    ⏱️ Durée estimée: {game.estimatedDuration}
                  </Typography>
                </Box>

                {/* Joueurs */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.8rem' } }}>
                    {Array.from({ length: Math.min(game.currentPlayers, 4) }, (_, i) => (
                      <Avatar key={i} sx={{ bgcolor: `hsl(${i * 90}, 70%, 60%)` }}>
                        {String.fromCharCode(65 + i)}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <Typography variant="body2" color="text.secondary">
                    {game.currentPlayers}/{game.maxPlayers} joueurs
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Boutons d'action */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {game.status === 'waiting' ? (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => handleJoinGame(game.id)}
                        disabled={game.currentPlayers >= game.maxPlayers}
                        fullWidth
                      >
                        {game.currentPlayers >= game.maxPlayers ? 'Complet' : 'Rejoindre'}
                      </Button>
                      {game.currentPlayers >= game.maxPlayers && (
                        <IconButton
                          color="primary"
                          onClick={() => handleWatchGame(game.id)}
                          title="Observer"
                        >
                          <People />
                        </IconButton>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<People />}
                      onClick={() => handleWatchGame(game.id)}
                      fullWidth
                    >
                      Observer
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Message si aucune partie */}
      {availableGames.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune partie disponible pour le moment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Soyez le premier à créer une partie !
          </Typography>
        </Box>
      )}
    </Container>
  )
}

export default LobbyPage