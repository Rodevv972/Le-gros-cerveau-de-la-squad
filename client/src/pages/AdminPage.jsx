import React, { useState } from 'react'
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
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  People,
  SportsEsports,
  QuestionAnswer,
  Settings,
  Add,
  Refresh,
  DeleteSweep,
  Warning
} from '@mui/icons-material'
import adminService from '../services/adminService'

const AdminPage = () => {
  // État pour le dialog de confirmation et les messages
  const [resetDialog, setResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetResult, setResetResult] = useState(null)

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

  // Fonction pour gérer le reset de la base de données
  const handleResetDatabase = async () => {
    setIsResetting(true)
    setResetResult(null)
    
    try {
      const result = await adminService.resetDatabase()
      setResetResult({
        type: 'success',
        message: result.message,
        details: result.details
      })
    } catch (error) {
      console.error('Erreur lors du reset:', error)
      setResetResult({
        type: 'error',
        message: error.response?.data?.error || 'Erreur lors de la réinitialisation'
      })
    } finally {
      setIsResetting(false)
      setResetDialog(false)
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

        {/* Section danger - Reset base */}
        <Box sx={{ mt: 4, p: 3, border: '2px solid', borderColor: 'error.main', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'error.main', fontWeight: 600 }}>
            ⚠️ Zone de danger
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Cette action supprimera toutes les données de jeu et réinitialisera les statistiques des utilisateurs.
            Les comptes administrateurs seront préservés.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={() => setResetDialog(true)}
            sx={{ py: 1.5 }}
          >
            Reset base
          </Button>
        </Box>
      </Box>

      {/* Affichage du résultat du reset */}
      {resetResult && (
        <Box sx={{ mb: 4 }}>
          <Alert 
            severity={resetResult.type} 
            onClose={() => setResetResult(null)}
            sx={{ mb: 2 }}
          >
            <Typography variant="body1" sx={{ mb: 1 }}>
              {resetResult.message}
            </Typography>
            {resetResult.details && (
              <Typography variant="body2">
                • {resetResult.details.gamesDeleted} parties supprimées<br/>
                • {resetResult.details.usersReset} utilisateurs réinitialisés<br/>
                • Comptes admin préservés: {resetResult.details.adminsPreserved ? 'Oui' : 'Non'}
              </Typography>
            )}
          </Alert>
        </Box>
      )}

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

      {/* Dialog de confirmation pour le reset */}
      <Dialog
        open={resetDialog}
        onClose={() => !isResetting && setResetDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Confirmer la réinitialisation
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>Attention :</strong> Cette action est irréversible et va :
          </DialogContentText>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Supprimer toutes les parties (en cours et historiques)</li>
            <li>Réinitialiser toutes les statistiques des utilisateurs non-admin</li>
            <li>Supprimer tous les badges des utilisateurs</li>
            <li>Vider l'historique des parties de tous les utilisateurs</li>
          </Box>
          <DialogContentText>
            <strong>Les comptes administrateurs seront préservés.</strong>
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
            Êtes-vous absolument certain de vouloir continuer ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setResetDialog(false)}
            disabled={isResetting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleResetDatabase}
            color="error"
            variant="contained"
            disabled={isResetting}
            startIcon={isResetting ? <CircularProgress size={20} /> : <DeleteSweep />}
          >
            {isResetting ? 'Réinitialisation...' : 'Confirmer Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminPage