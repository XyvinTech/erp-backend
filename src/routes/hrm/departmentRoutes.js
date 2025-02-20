import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { departmentValidation } from '../../validations/hrm/departmentValidation';
import { departmentController } from '../../controllers/hrm/departmentController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for department name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by department status
 *     responses:
 *       200:
 *         description: List of departments
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, departmentController.getDepartments);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
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
 *         description: Department details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, departmentController.getDepartment);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       201:
 *         description: Department created successfully
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
  validateRequest(departmentValidation.createDepartment),
  departmentController.createDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Update a department
 *     tags: [Departments]
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
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(departmentValidation.updateDepartment),
  departmentController.updateDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Departments]
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
 *         description: Department deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, departmentController.deleteDepartment);

export default router; 