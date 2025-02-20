const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../../middleware/auth');
const {
  getAllAttendance,
  getAttendance,
  createAttendance,
  createBulkAttendance,
  checkOut,
  deleteAttendance,
  getAttendanceStats,
  updateAttendance,
  getEmployeeAttendance,
  getAttendanceByEmployeeId
} = require('../controllers/attendanceController');
const { protect } = require('../../../middleware/authMiddleware');

// Protected routes
router.use(auth);

// Employee attendance routes (must come before /:id routes)
router.get('/my-attendance', getEmployeeAttendance);

// Get attendance by employee ID
router.get('/employee/:employeeId', checkPermissions('view_attendance'), getAttendanceByEmployeeId);

// Bulk attendance route
router.post('/bulk', checkPermissions('manage_attendance'), createBulkAttendance);

// Statistics route
router.get('/stats', checkPermissions('view_attendance'), getAttendanceStats);

// Basic routes
router.route('/')
  .get(checkPermissions('view_attendance'), getAllAttendance)
  .post(checkPermissions('manage_attendance'), createAttendance);

// ID-based routes should come last
router.route('/:id')
  .get(checkPermissions('view_attendance'), getAttendance)
  .put(checkPermissions('manage_attendance'), updateAttendance)
  .delete(checkPermissions('manage_attendance'), deleteAttendance);

// Checkout route
router.post('/:id/checkout', checkPermissions('manage_attendance'), checkOut);

module.exports = router; 