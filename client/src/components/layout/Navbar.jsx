import React from 'react'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Badge
} from '@mui/material'
import { 
  ExitToApp, 
  Person, 
  Leaderboard, 
  AdminPanelSettings,
  Home
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const { connected } = useSocket()
  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
    navigate('/')
  }

  const handleProfileClick = () => {
    navigate('/profile')
    handleMenuClose()
  }

  const handleLeaderboardClick = () => {
    navigate('/leaderboard')
    handleMenuClose()
  }

  const handleAdminClick = () => {
    navigate('/admin')
    handleMenuClose()
  }

  return (
    <AppBar position="static" sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
      <Toolbar>
        {/* Logo et titre */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              color: 'primary.main',
              cursor: 'pointer'
            }}
            onClick={() => navigate(user ? '/lobby' : '/')}
          >
            🧠 Le Gros cerveau de la Squad
          </Typography>
        </Box>

        {/* Navigation */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Indicateur de connexion */}
            <Chip
              size="small"
              label={connected ? 'En ligne' : 'Hors ligne'}
              color={connected ? 'success' : 'default'}
              variant="outlined"
            />

            {/* Boutons de navigation */}
            <Button
              color="primary"
              startIcon={<Home />}
              onClick={() => navigate('/lobby')}
            >
              Lobby
            </Button>

            <Button
              color="primary"
              startIcon={<Leaderboard />}
              onClick={() => navigate('/leaderboard')}
            >
              Classement
            </Button>

            {/* Menu utilisateur */}
            <Badge
              badgeContent={user.stats?.totalScore > 0 ? user.stats.totalScore : 0}
              color="secondary"
              max={999999}
            >
              <Avatar
                sx={{ 
                  cursor: 'pointer',
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main'
                }}
                onClick={handleMenuOpen}
              >
                {user.avatar || user.username.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <Person sx={{ mr: 1 }} />
                Profil
              </MenuItem>
              
              <MenuItem onClick={handleLeaderboardClick}>
                <Leaderboard sx={{ mr: 1 }} />
                Classement
              </MenuItem>

              {isAdmin() && (
                <MenuItem onClick={handleAdminClick}>
                  <AdminPanelSettings sx={{ mr: 1 }} />
                  Administration
                </MenuItem>
              )}

              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        )}

        {/* Boutons pour utilisateurs non connectés */}
        {!user && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="primary" 
              variant="outlined"
              onClick={() => navigate('/login')}
            >
              Connexion
            </Button>
            <Button 
              color="primary" 
              variant="contained"
              onClick={() => navigate('/register')}
            >
              Inscription
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default Navbar