import React, { useState } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Grid
} from '@mui/material'
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person,
  EmojiEmotions 
} from '@mui/icons-material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const avatarOptions = ['🧠', '🤓', '🔬', '⚛️', '🧪', '🔭', '📐', '🌟', '🚀', '💡']

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, loading, error } = useAuth()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '🧠'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({
      ...prev,
      avatar
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.username) {
      errors.username = 'Nom d\'utilisateur requis'
    } else if (formData.username.length < 3) {
      errors.username = 'Minimum 3 caractères'
    } else if (formData.username.length > 20) {
      errors.username = 'Maximum 20 caractères'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Seuls les lettres, chiffres et _ sont autorisés'
    }
    
    if (!formData.email) {
      errors.email = 'Email requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email invalide'
    }
    
    if (!formData.password) {
      errors.password = 'Mot de passe requis'
    } else if (formData.password.length < 6) {
      errors.password = 'Minimum 6 caractères'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmation requise'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const { confirmPassword, ...userData } = formData
      await register(userData)
      navigate('/lobby')
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="md">
        <Paper 
          elevation={24}
          sx={{ 
            p: 4, 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              🚀 Inscription
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Rejoignez la communauté des cerveaux !
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="username"
                  label="Nom d'utilisateur"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="password"
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  <EmojiEmotions sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Choisissez votre avatar :
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {avatarOptions.map((avatar) => (
                    <Button
                      key={avatar}
                      variant={formData.avatar === avatar ? 'contained' : 'outlined'}
                      onClick={() => handleAvatarSelect(avatar)}
                      sx={{ 
                        minWidth: 50, 
                        fontSize: '1.5rem',
                        aspectRatio: '1'
                      }}
                    >
                      {avatar}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 4, mb: 3, py: 1.5 }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Déjà un compte ?{' '}
              <Link component={RouterLink} to="/login" color="primary">
                Se connecter
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default RegisterPage