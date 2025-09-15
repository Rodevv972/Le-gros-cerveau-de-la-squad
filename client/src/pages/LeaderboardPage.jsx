import React from 'react'
import { Container, Typography, Box } from '@mui/material'

const LeaderboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          🏆 Classement
        </Typography>
      </Box>
      
      {/* TODO: Ajouter le classement global */}
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Interface de classement en cours de développement...
        </Typography>
      </Box>
    </Container>
  )
}

export default LeaderboardPage