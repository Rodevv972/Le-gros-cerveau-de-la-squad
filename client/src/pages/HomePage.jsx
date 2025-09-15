import React from 'react'
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  Chip
} from '@mui/material'
import { 
  Science, 
  Groups, 
  EmojiEvents, 
  PlayArrow 
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Science sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Quiz Sciences',
      description: 'Testez vos connaissances en physique, chimie, biologie, mathématiques et plus encore !'
    },
    {
      icon: <Groups sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Multijoueur',
      description: 'Affrontez jusqu\'à 50 joueurs en temps réel dans des parties épiques !'
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Classements',
      description: 'Grimpez dans les classements et débloquez des badges exclusifs !'
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="lg" sx={{ pt: 8, pb: 8 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8, color: 'white' }}>
          <Typography 
            variant="h1" 
            sx={{ 
              mb: 3, 
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '4rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            🧠 Le Gros cerveau de la Squad
          </Typography>
          
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              fontWeight: 300,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              opacity: 0.9
            }}
          >
            Quiz sciences multijoueur en direct
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => navigate('/register')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                background: 'white',
                color: 'primary.main',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            >
              Commencer à jouer
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Se connecter
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Chip 
                label="🎯 Questions générées par IA"
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  py: 3,
                  px: 2
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Chip 
                label="⚡ Timer 15 secondes"
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  py: 3,
                  px: 2
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Chip 
                label="👀 Mode spectateur"
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  py: 3,
                  px: 2
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Features */}
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', mt: 8, color: 'white' }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>
            Prêt à tester votre cerveau ?
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/register')}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.2rem',
              background: 'white',
              color: 'primary.main',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)'
              }
            }}
          >
            Rejoindre la compétition
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default HomePage