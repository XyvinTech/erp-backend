import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { positionValidation } from '../../validations/hrm/positionValidation';
import { positionController } from '../../controllers/hrm/positionController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Get all positions
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for position title
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by position status
 *     responses:
 *       200:
 *         description: List of positions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, positionController.getPositions);

/**
 * @swagger
 * /api/positions/{id}:
 *   get:
 *     summary: Get position by ID
 *     tags: [Positions]
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
 *         description: Position details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Position not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, positionController.getPosition);

/**
 * @swagger
 * /api/positions:
 *   post:
 *     summary: Create a new position
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Position'
 *     responses:
 *       201:
 *         description: Position created successfully
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
  validateRequest(positionValidation.createPosition),
  positionController.createPosition
);

/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     summary: Update a position
 *     tags: [Positions]
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
 *             $ref: '#/components/schemas/Position'
 *     responses:
 *       200:
 *         description: Position updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Position not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(positionValidation.updatePosition),
  positionController.updatePosition
);

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     summary: Delete a position
 *     tags: [Positions]
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
 *         description: Position deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Position not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, positionController.deletePosition);

export default router; 