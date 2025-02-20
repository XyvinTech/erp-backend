const express = require('express');
const router = express.Router();
const { 
  getAllLeaves, 
  getLeave, 
  createLeave, 
  updateLeave, 
  deleteLeave, 
  reviewLeave,
  getLeaveStats 
} = require('../controllers/leaveController');
const { auth, checkPermissions } = require('../../../middleware/auth');

// Protect all routes
router.use(auth);

// Leave statistics route
router.route('/stats')
  .get(checkPermissions('view_leaves'), getLeaveStats);

// Leave routes
router.route('/')
  .get(getAllLeaves)
  .post(createLeave);

router.route('/:id')
  .get(getLeave)
  .patch(checkPermissions('manage_leaves'), updateLeave)
  .delete(checkPermissions('manage_leaves'), deleteLeave);

// Separate route for reviewing leaves
router.route('/:id/review')
  .patch(checkPermissions('approve_leaves'), reviewLeave);

module.exports = router;