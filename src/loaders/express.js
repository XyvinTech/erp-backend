const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('../config/config');
const routes = require('../routes');
const { handleError, handleNotFound } = require('../middleware/errorHandler');

module.exports = async ({ app }) => {
  // CORS configuration
  app.use(cors(config.cors));

  // Body parser
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Development logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  }

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // Load API routes
  app.use('/api', routes);

  // Handle 404
  app.use(handleNotFound);

  // Error handling
  app.use(handleError);

  return app;
}; 