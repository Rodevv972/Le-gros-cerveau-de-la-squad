import React from 'react'
import { Container, Typography, Box } from '@mui/material'

const LobbyPage = () => {
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
      
      {/* TODO: Ajouter la liste des parties disponibles */}
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Interface du lobby en cours de développement...
        </Typography>
      </Box>
    </Container>
  )
}

export default LobbyPage