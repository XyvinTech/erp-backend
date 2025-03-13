const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const { auth, checkPermissions } = require('../../../middleware/auth');

// Place the next-code route first (before ID routes)
router.get('/code/next', auth, checkPermissions('view_departments'), departmentController.getNextDepartmentCode);

// Department routes
router.route('/')
    .get(auth, checkPermissions('view_departments'), departmentController.getAllDepartments)
    .post(auth, checkPermissions('manage_departments'), departmentController.createDepartment);

router.route('/:id')
    .get(auth, checkPermissions('view_departments'), departmentController.getDepartment)
    .put(auth, checkPermissions('manage_departments'), departmentController.updateDepartment)
    .delete(auth, checkPermissions('manage_departments'), departmentController.deleteDepartment);

module.exports = router; 