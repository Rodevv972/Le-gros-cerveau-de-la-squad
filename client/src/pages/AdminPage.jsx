import React from 'react'
import { Container, Typography, Box } from '@mui/material'

const AdminPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ⚙️ Administration
        </Typography>
      </Box>
      
      {/* TODO: Ajouter le dashboard admin */}
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Interface d'administration en cours de développement...
        </Typography>
      </Box>
    </Container>
  )
}

export default AdminPage