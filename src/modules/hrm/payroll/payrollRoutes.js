const express = require('express');
const router = express.Router();
const { auth, checkPermissions } = require('../../../middleware/auth');
const payrollController = require('../controllers/payrollController');

// Employee routes (must come before other routes)
router.get('/my-payroll', auth, payrollController.getMyPayroll);

// Get all payroll records
router.get('/', auth, checkPermissions('view_payroll'), payrollController.getAllPayroll);

// Get payroll by ID
router.get('/:id', auth, checkPermissions('view_payroll'), payrollController.getPayrollById);

// Get employee salary
router.get('/employee/:employeeId/salary', auth, checkPermissions('view_payroll'), payrollController.getEmployeeSalary);

// Create new payroll
router.post('/', auth, checkPermissions('manage_payroll'), payrollController.createPayroll);

// Update payroll
router.put('/:id', auth, checkPermissions('manage_payroll'), payrollController.updatePayroll);

// Delete payroll
router.delete('/:id', auth, checkPermissions('manage_payroll'), payrollController.deletePayroll);

// Generate payroll
router.post('/generate', auth, checkPermissions('manage_payroll'), payrollController.generatePayroll);

// Download payroll
router.get('/:id/download', auth, checkPermissions('view_payroll'), payrollController.downloadPayroll);

// The route handler needs to be registered in the main app
module.exports = router; 