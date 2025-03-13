const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../middleware/auth');

// Import controllers
// const departmentController = require('./department/department.controller');
// const positionController = require('./position/positionController');
// const employeeController = require('../hrm/employee/employee.controller');
// const attendanceController = require('./attendance/attendance.controller');
// const leaveController = require('./leave/leave.controller');

// Department routes
router.use('/departments', require('./department/department.routes'));

// Position routes
router.use('/positions', require('./position/position.routes'));

// Employee routes
router.use('/employees', require('./employee/employee.routes'));

// Attendance routes
router.use('/attendance', require('./attendance/attendance.routes'));

// Leave routes
router.use('/leaves', require('./leave/leave.routes'));

// Events routes
router.use('/events', require('./events/events.route'));

module.exports = router; 