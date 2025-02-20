import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { payrollValidation } from '../../validations/hrm/payrollValidation';
import { payrollController } from '../../controllers/hrm/payrollController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/payroll:
 *   get:
 *     summary: Get payroll records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: Month for payroll records (YYYY-MM)
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
 *           enum: [pending, processed, paid]
 *         description: Filter by payroll status
 *     responses:
 *       200:
 *         description: List of payroll records
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, payrollController.getPayroll);

/**
 * @swagger
 * /api/payroll/{id}:
 *   get:
 *     summary: Get payroll record by ID
 *     tags: [Payroll]
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
 *         description: Payroll record details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payroll record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, payrollController.getPayrollById);

/**
 * @swagger
 * /api/payroll:
 *   post:
 *     summary: Create a new payroll record
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payroll'
 *     responses:
 *       201:
 *         description: Payroll record created successfully
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
  validateRequest(payrollValidation.createPayroll),
  payrollController.createPayroll
);

/**
 * @swagger
 * /api/payroll/{id}:
 *   put:
 *     summary: Update a payroll record
 *     tags: [Payroll]
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
 *             $ref: '#/components/schemas/Payroll'
 *     responses:
 *       200:
 *         description: Payroll record updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payroll record not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(payrollValidation.updatePayroll),
  payrollController.updatePayroll
);

/**
 * @swagger
 * /api/payroll/{id}:
 *   delete:
 *     summary: Delete a payroll record
 *     tags: [Payroll]
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
 *         description: Payroll record deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payroll record not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, payrollController.deletePayroll);

/**
 * @swagger
 * /api/payroll/generate:
 *   post:
 *     summary: Generate payroll for a specific period
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *             properties:
 *               month:
 *                 type: string
 *                 format: date
 *                 description: Month for payroll generation (YYYY-MM)
 *               department:
 *                 type: string
 *                 description: Generate for specific department
 *     responses:
 *       200:
 *         description: Payroll generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/generate',
  authMiddleware,
  validateRequest(payrollValidation.generatePayroll),
  payrollController.generatePayroll
);

/**
 * @swagger
 * /api/payroll/{id}/download:
 *   get:
 *     summary: Download payroll record as PDF
 *     tags: [Payroll]
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
 *         description: Payroll PDF document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payroll record not found
 *       500:
 *         description: Server error
 */
router.get('/:id/download', authMiddleware, payrollController.downloadPayroll);

export default router; 