const express = require('express');
const router = express.Router();
const { protect, authorize, checkModuleAccess } = require('../middleware/authMiddleware');
const { 
  createEmployee,
  // ... other controller functions
} = require('../controllers/employeeController');

// Public routes
router.post('/login', login);

// Protected routes
router.post('/create', protect, authorize('superadmin', 'hr_manager'), createEmployee);
router.get('/employees', protect, checkModuleAccess('employees'), getAllEmployees);
// ... other routes

module.exports = router; 