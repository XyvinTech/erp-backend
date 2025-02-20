const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const { auth, checkPermissions } = require('../../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Protected routes
router.use(auth);
router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.patch('/update-password', userController.updatePassword);

// Admin only routes
router.use(checkPermissions('manage_users'));
router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;