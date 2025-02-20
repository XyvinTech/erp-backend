const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { auth } = require('../../middleware/auth');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/stats', auth, controller.getStats);

/**
 * @swagger
 * /api/dashboard/attendance:
 *   get:
 *     summary: Get attendance chart data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance data retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/attendance', auth, controller.getAttendance);

/**
 * @swagger
 * /api/dashboard/departments:
 *   get:
 *     summary: Get department distribution data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department data retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/departments', auth, controller.getDepartments);

module.exports = router; 