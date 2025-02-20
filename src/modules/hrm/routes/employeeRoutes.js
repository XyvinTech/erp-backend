const express = require('express');
const router = express.Router();
const { auth, checkPermissions, checkSelfOrPermission } = require('../../../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  updateProfilePicture,
  upload,
  getCurrentEmployee,
  updateCurrentEmployee
} = require('../controllers/employeeController');

// Get current employee profile
router.get('/me', auth, getCurrentEmployee);

// Update current employee profile
router.patch('/me', auth, updateCurrentEmployee);

// Get all employees
router.get('/', auth, checkPermissions('view_employees'), getAllEmployees);

// Get employee by ID
router.get('/:id', auth, checkPermissions('view_employees'), getEmployeeById);

// Create new employee
router.post('/', auth, checkPermissions('manage_employees'), createEmployee);

// Update employee - allow self update or admin
router.route('/:id')
  .put(auth, (req, res, next) => {
    if (req.user._id.toString() === req.params.id) {
      return updateCurrentEmployee(req, res, next);
    }
    return checkPermissions('manage_employees')(req, res, () => updateEmployee(req, res, next));
  })
  .patch(auth, (req, res, next) => {
    if (req.user._id.toString() === req.params.id) {
      return updateCurrentEmployee(req, res, next);
    }
    return checkPermissions('manage_employees')(req, res, () => updateEmployee(req, res, next));
  });

// Update employee profile picture - allow self update or admin
router.post('/:id/profile-picture', auth, (req, res, next) => {
  if (req.user._id.toString() === req.params.id) {
    return upload.single('profilePicture')(req, res, () => updateProfilePicture(req, res, next));
  }
  return checkPermissions('manage_employees')(req, res, () => {
    upload.single('profilePicture')(req, res, () => updateProfilePicture(req, res, next));
  });
});

// Delete employee
router.delete('/:id', auth, checkPermissions('manage_employees'), deleteEmployee);

// Upload document
router.post('/:id/documents', auth, checkPermissions('manage_employees'), uploadDocument);

module.exports = router; 