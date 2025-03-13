const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { validateLogin, validateRegister } = require('./validation');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Public routes
router.post('/register', validateRegister, controller.register);
router.post('/login', validateLogin, controller.login);

// Protected routes
router.use(protect);
router.use(authorize('ERP System Administrator',
            'IT Manager',
            'Project Manager',
            'Business Analyst',
            'Developer',
            'Quality Assurance Specialist',
            'HR Manager',
            'Finance Manager',
            'Sales Manager',
            'Employee'));

router.get('/me', controller.getProfile);
router.post('/logout', controller.logout);

module.exports = router; 