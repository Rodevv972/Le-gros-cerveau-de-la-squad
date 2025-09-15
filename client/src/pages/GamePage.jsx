import React from 'react'
import { Container, Typography, Box } from '@mui/material'

const GamePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          🎯 Partie en Cours
        </Typography>
      </Box>
      
      {/* TODO: Ajouter l'interface de jeu */}
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Interface de jeu en cours de développement...
        </Typography>
      </Box>
    </Container>
  )
}

export default GamePage