const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');

// Import route modules
const departmentRoutes = require('./routes/departmentRoutes');
const positionRoutes = require('./routes/positionRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');

// Mount routes
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);

// Export router
module.exports = router; 