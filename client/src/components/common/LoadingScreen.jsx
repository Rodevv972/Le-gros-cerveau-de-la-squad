import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

const LoadingScreen = ({ message = 'Chargement...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      <CircularProgress 
        size={60} 
        sx={{ 
          color: 'white',
          mb: 3
        }} 
      />
      <Typography variant="h6" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  )
}

export default LoadingScreen