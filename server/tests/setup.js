// Test setup file for Jest
// This file is executed before any tests are run

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.MONGODB_URI = 'mongodb://localhost:27017/quiz-test'

// Increase timeout for database operations
jest.setTimeout(30000)

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}