const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../../middleware/auth');
const controller = require('./controller');

router.use(auth);
// Get all departments
router.get('/',  checkPermissions('view_departments'), controller.getAllDepartments);

// Get department by ID
router.get('/:id',  checkPermissions('view_departments'), controller.getDepartmentById);

// Create new department
router.post('/',  checkPermissions('manage_departments'), controller.createDepartment);

// Update department
router.put('/:id',  checkPermissions('manage_departments'), controller.updateDepartment);

// Delete department
router.delete('/:id',  checkPermissions('manage_departments'), controller.deleteDepartment);

module.exports = router; 