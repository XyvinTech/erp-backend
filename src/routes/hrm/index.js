import { Router } from 'express';
import employeeRoutes from './employeeRoutes';
import departmentRoutes from './departmentRoutes';
import positionRoutes from './positionRoutes';
import attendanceRoutes from './attendanceRoutes';
import leaveRoutes from './leaveRoutes';
import payrollRoutes from './payrollRoutes';
import employeeController from '../../controllers/employeeController';

const router = Router();

// Mount HRM routes
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);

// Employee routes
router.get('/employees', employeeController.getEmployees);
router.get('/employees/:id', employeeController.getEmployee);
router.post('/employees', employeeController.createEmployee);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);

export default router; 