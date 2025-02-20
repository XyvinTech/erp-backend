const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../../middleware/auth');
const controller = require('./controller');

// Get all departments
router.get('/', auth, checkPermissions('view_departments'), controller.getAllDepartments);

// Get department by ID
router.get('/:id', auth, checkPermissions('view_departments'), controller.getDepartmentById);

// Create new department
router.post('/', auth, checkPermissions('manage_departments'), controller.createDepartment);

// Update department
router.put('/:id', auth, checkPermissions('manage_departments'), controller.updateDepartment);

// Delete department
router.delete('/:id', auth, checkPermissions('manage_departments'), controller.deleteDepartment);

module.exports = router; 