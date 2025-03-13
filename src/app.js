const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const runSeeds = require('../seeds/index');

// Import database connection
const connectDB = require('./config/database');

// Import routes
const routes = require('./routes');
const payrollRoutes = require('./modules/hrm/routes/payrollRoutes');
const clientRoutes = require('./modules/client/client.routes');
const projectRoutes = require('./modules/project/project.routes');
const taskRoutes = require('./modules/project/task.routes');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

runSeeds().then(() => {
  console.log('Seeds executed successfully');
}).catch((error) => {
  console.error('Error seeding:', error);
  process.exit(1);
});
// Serve static files from the public directory with CORS enabled
app.use('/public', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'public')));

// Setup API routes
app.use('/api', routes);
app.use('/api/hrm/payroll', payrollRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the full error for debugging
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    status: err.status,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    user: req.user ? { id: req.user._id, role: req.user.role } : null
  });

  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      statusCode,
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details || undefined
      })
    }
  });
});

// 404 handler - Must be after all other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      statusCode: 404,
      status: 'fail',
      message: 'Route not found'
    }
  });
});

// Connect to database and start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    app.listen(PORT, HOST, () => {
      console.log(`Server running at http://${HOST}:${PORT}`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Allowed Origins:', (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim()));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 