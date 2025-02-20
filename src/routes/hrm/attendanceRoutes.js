import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { attendanceValidation } from '../../validations/hrm/attendanceValidation';
import { attendanceController } from '../../controllers/hrm/attendanceController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for attendance records
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for attendance records
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: List of attendance records
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, attendanceController.getAttendance);

/**
 * @swagger
 * /api/attendance/check-in:
 *   post:
 *     summary: Record employee check-in
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Check-in recorded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/check-in',
  authMiddleware,
  validateRequest(attendanceValidation.checkIn),
  attendanceController.checkIn
);

/**
 * @swagger
 * /api/attendance/check-out/{id}:
 *   post:
 *     summary: Record employee check-out
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out recorded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Attendance record not found
 *       500:
 *         description: Server error
 */
router.post(
  '/check-out/:id',
  authMiddleware,
  validateRequest(attendanceValidation.checkOut),
  attendanceController.checkOut
);

export default router; 