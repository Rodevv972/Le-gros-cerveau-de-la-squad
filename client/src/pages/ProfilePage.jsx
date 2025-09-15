import React from 'react'
import { Container, Typography, Box } from '@mui/material'

const ProfilePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          👤 Mon Profil
        </Typography>
      </Box>
      
      {/* TODO: Ajouter les statistiques et badges */}
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Interface de profil en cours de développement...
        </Typography>
      </Box>
    </Container>
  )
}

export default ProfilePage