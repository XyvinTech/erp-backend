import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { employeeValidation } from '../../validations/hrm/employeeValidation';
import { employeeController } from '../../controllers/hrm/employeeController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for employee name or email
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by employee status
 *     responses:
 *       200:
 *         description: List of employees
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, employeeController.getEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
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
 *         description: Employee details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, employeeController.getEmployee);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created successfully
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
  validateRequest(employeeValidation.createEmployee),
  employeeController.createEmployee
);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employees]
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
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(employeeValidation.updateEmployee),
  employeeController.updateEmployee
);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete an employee
 *     tags: [Employees]
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
 *         description: Employee deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, employeeController.deleteEmployee);

export default router; 