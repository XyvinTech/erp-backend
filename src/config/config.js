require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  mongoURI: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  },
  logs: {
    level: process.env.LOG_LEVEL || 'debug'
  }
}; 