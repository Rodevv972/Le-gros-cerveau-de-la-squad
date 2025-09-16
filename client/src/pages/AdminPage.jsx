import React from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  People,
  SportsEsports,
  QuestionAnswer,
  Settings,
  Add,
  Refresh
} from '@mui/icons-material'

const AdminPage = () => {
  // Mock data pour les statistiques
  const stats = {
    totalUsers: 1247,
    activeUsers: 89,
    totalGames: 156,
    activeGames: 3,
    totalQuestions: 2450
  }

  // Mock data pour les parties récentes
  const recentGames = [
    { id: 1, name: 'Physique Quantique', status: 'playing', players: 8, createdBy: 'admin1' },
    { id: 2, name: 'Chimie Organique', status: 'waiting', players: 3, createdBy: 'admin2' },
    { id: 3, name: 'Mathématiques', status: 'finished', players: 12, createdBy: 'admin1' },
    { id: 4, name: 'Biologie', status: 'waiting', players: 5, createdBy: 'admin3' },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'playing': return 'success'
      case 'waiting': return 'warning'
      case 'finished': return 'default'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'playing': return 'En cours'
      case 'waiting': return 'En attente'
      case 'finished': return 'Terminée'
      default: return status
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ⚙️ Administration
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Tableau de bord administrateur
        </Typography>
      </Box>

      {/* Statistiques générales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalUsers}
              </Typography>
              <Typography color="text.secondary">
                Utilisateurs
              </Typography>
              <Typography variant="body2" color="success.main">
                {stats.activeUsers} actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <SportsEsports sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalGames}
              </Typography>
              <Typography color="text.secondary">
                Parties totales
              </Typography>
              <Typography variant="body2" color="warning.main">
                {stats.activeGames} en cours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <QuestionAnswer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalQuestions}
              </Typography>
              <Typography color="text.secondary">
                Questions
              </Typography>
              <Typography variant="body2" color="info.main">
                Base de données
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Settings sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                Système
              </Typography>
              <Typography color="text.secondary">
                Statut
              </Typography>
              <Typography variant="body2" color="success.main">
                Opérationnel
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Actions rapides
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              sx={{ py: 1.5 }}
            >
              Nouvelle partie
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              sx={{ py: 1.5 }}
            >
              Ajouter question
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<People />}
              sx={{ py: 1.5 }}
            >
              Gérer utilisateurs
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              sx={{ py: 1.5 }}
            >
              Actualiser
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Parties récentes */}
      <Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Parties récentes
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nom de la partie</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Joueurs</strong></TableCell>
                <TableCell><strong>Créée par</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentGames.map((game) => (
                <TableRow key={game.id} hover>
                  <TableCell>{game.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(game.status)}
                      color={getStatusColor(game.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{game.players} joueurs</TableCell>
                  <TableCell>{game.createdBy}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Gérer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  )
}

export default AdminPage