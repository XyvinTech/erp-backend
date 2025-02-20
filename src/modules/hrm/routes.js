const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../middleware/auth');

// Import controllers
const departmentController = require('./controllers/departmentController');
const positionController = require('./controllers/positionController');
const employeeController = require('./controllers/employeeController');
const attendanceController = require('./controllers/attendanceController');
const leaveController = require('./controllers/leaveController');

// Department routes
router.use('/departments', require('./routes/departmentRoutes'));

// Position routes
router.use('/positions', require('./routes/positionRoutes'));

// Employee routes
router.use('/employees', require('./routes/employeeRoutes'));

// Attendance routes
router.use('/attendance', require('./routes/attendanceRoutes'));

// Leave routes
router.use('/leaves', require('./routes/leaveRoutes'));

module.exports = router; 