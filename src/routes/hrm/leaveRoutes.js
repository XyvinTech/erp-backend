import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { leaveValidation } from '../../validations/hrm/leaveValidation';
import { leaveController } from '../../controllers/hrm/leaveController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Get leave requests
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for leave requests
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for leave requests
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by leave status
 *     responses:
 *       200:
 *         description: List of leave requests
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, leaveController.getLeaves);

/**
 * @swagger
 * /api/leaves/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, leaveController.getLeave);

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Create a new leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Leave'
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(leaveValidation.createLeave),
  leaveController.createLeave
);

/**
 * @swagger
 * /api/leaves/{id}:
 *   put:
 *     summary: Update a leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Leave'
 *     responses:
 *       200:
 *         description: Leave request updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(leaveValidation.updateLeave),
  leaveController.updateLeave
);

/**
 * @swagger
 * /api/leaves/{id}:
 *   delete:
 *     summary: Delete a leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, leaveController.deleteLeave);

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   post:
 *     summary: Approve a leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 */
router.post('/:id/approve', authMiddleware, leaveController.approveLeave);

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   post:
 *     summary: Reject a leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave request rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reject', authMiddleware, leaveController.rejectLeave);

export default router; 