const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { auth, checkPermissions } = require('../../../middleware/auth');

// Get all positions
router.get(
  '/',
  auth,
  checkPermissions('view_positions'),
  controller.getAllPositions
);

// Get position by ID
router.get(
  '/:id',
  auth,
  checkPermissions('view_positions'),
  controller.getPositionById
);

// Create new position
router.post(
  '/',
  auth,
  checkPermissions('manage_positions'),
  controller.createPosition
);

// Update position
router.put(
  '/:id',
  auth,
  checkPermissions('manage_positions'),
  controller.updatePosition
);

// Delete position
router.delete(
  '/:id',
  auth,
  checkPermissions('manage_positions'),
  controller.deletePosition
);

module.exports = router; 