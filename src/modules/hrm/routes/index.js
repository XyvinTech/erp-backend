const express = require('express');
const router = express.Router();
const departmentRoutes = require('./departmentRoutes');

// Register department routes
router.use('/departments', departmentRoutes);

// ... other HRM routes

module.exports = router; 