import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Button,
  LinearProgress,
  Grid,
  Chip,
  Alert
} from '@mui/material'
import {
  Timer,
  Stars,
  QuestionAnswer
} from '@mui/icons-material'

const GamePage = () => {
  // État du jeu
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions] = useState(10)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(1250)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Mock question data
  const questionData = {
    question: "Quelle est la vitesse de la lumière dans le vide ?",
    options: [
      "299 792 458 m/s",
      "300 000 000 m/s", 
      "299 792 459 m/s",
      "298 000 000 m/s"
    ],
    correctAnswer: 0,
    explanation: "La vitesse de la lumière dans le vide est exactement 299 792 458 mètres par seconde, une constante physique fondamentale."
  }

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleSubmitAnswer()
    }
  }, [timeLeft, showResult])

  const handleAnswerSelect = (index) => {
    if (!showResult) {
      setSelectedAnswer(index)
    }
  }

  const handleSubmitAnswer = () => {
    if (showResult) return
    
    const correct = selectedAnswer === questionData.correctAnswer
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      setScore(prev => prev + (timeLeft * 10))
    }
  }

  const handleNextQuestion = () => {
    setCurrentQuestion(prev => prev + 1)
    setTimeLeft(30)
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(false)
  }

  const getProgressValue = () => {
    return ((30 - timeLeft) / 30) * 100
  }

  const getProgressColor = () => {
    if (timeLeft > 20) return 'success'
    if (timeLeft > 10) return 'warning'
    return 'error'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête du jeu */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          🎯 Partie en Cours
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
          Physique Quantique - Question {currentQuestion}/{totalQuestions}
        </Typography>
      </Box>

      {/* Barre de statut */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent sx={{ pb: 2 }}>
              <Timer sx={{ fontSize: 30, color: getProgressColor() + '.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color={getProgressColor() + '.main'}>
                {timeLeft}s
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getProgressValue()} 
                color={getProgressColor()}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent sx={{ pb: 2 }}>
              <Stars sx={{ fontSize: 30, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {score.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">
                Points
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent sx={{ pb: 2 }}>
              <QuestionAnswer sx={{ fontSize: 30, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {currentQuestion}/{totalQuestions}
              </Typography>
              <Typography color="text.secondary">
                Questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Question */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
          {questionData.question}
        </Typography>

        {/* Options de réponse */}
        <Grid container spacing={2}>
          {questionData.options.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Button
                fullWidth
                variant={selectedAnswer === index ? "contained" : "outlined"}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                sx={{ 
                  py: 2, 
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  backgroundColor: showResult && index === questionData.correctAnswer 
                    ? 'success.light' 
                    : showResult && selectedAnswer === index && !isCorrect
                    ? 'error.light'
                    : undefined,
                  color: showResult && index === questionData.correctAnswer 
                    ? 'success.contrastText' 
                    : showResult && selectedAnswer === index && !isCorrect
                    ? 'error.contrastText'
                    : undefined,
                  '&:hover': {
                    backgroundColor: showResult && index === questionData.correctAnswer 
                      ? 'success.light' 
                      : showResult && selectedAnswer === index && !isCorrect
                      ? 'error.light'
                      : undefined,
                  }
                }}
              >
                <Chip 
                  label={String.fromCharCode(65 + index)} 
                  size="small" 
                  sx={{ mr: 2 }}
                />
                {option}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Résultat et explication */}
      {showResult && (
        <Alert 
          severity={isCorrect ? "success" : "error"} 
          sx={{ mb: 3 }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {isCorrect ? "🎉 Bonne réponse !" : "❌ Mauvaise réponse"}
          </Typography>
          <Typography>
            {questionData.explanation}
          </Typography>
        </Alert>
      )}

      {/* Boutons d'action */}
      <Box sx={{ textAlign: 'center' }}>
        {!showResult ? (
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            sx={{ px: 4, py: 1.5 }}
          >
            Valider ma réponse
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={handleNextQuestion}
            sx={{ px: 4, py: 1.5 }}
          >
            {currentQuestion < totalQuestions ? "Question suivante" : "Terminer la partie"}
          </Button>
        )}
      </Box>
    </Container>
  )
}

export default GamePage