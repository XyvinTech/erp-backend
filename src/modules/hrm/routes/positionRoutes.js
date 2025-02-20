const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../../middleware/auth');
const positionController = require('../controllers/positionController');

// Get all positions
router.get('/', auth, positionController.getAllPositions);

// Get single position
router.get('/:id', auth, positionController.getPosition);

// Create position
router.post('/', auth, checkPermissions('manage_positions'), positionController.createPosition);

// Update position
router.put('/:id', auth, checkPermissions('manage_positions'), positionController.updatePosition);

// Delete position
router.delete('/:id', auth, checkPermissions('manage_positions'), positionController.deletePosition);

// Add this route before other routes to avoid conflicts with ID parameters
router.get('/code/next', auth, checkPermissions('view_positions'), positionController.getNextPositionCode);

module.exports = router; 