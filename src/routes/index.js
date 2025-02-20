const express = require('express');
const router = express.Router();

// Import modules
const authRoutes = require('../modules/auth/routes');
const hrmRoutes = require('../modules/hrm/routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/hrm', hrmRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;