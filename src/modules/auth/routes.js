const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateLogin, validateRegister } = require('./validation');
const { auth } = require('../../middleware/auth');

// Auth routes - all prefixed with /api/auth from main app
router.post('/register', validateRegister, controller.register);
router.post('/login', validateLogin, controller.login);
router.get('/me', auth, controller.getProfile);
router.post('/logout', auth, controller.logout);

module.exports = router; 