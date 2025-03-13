// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/authMiddleware');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
} = require('./events.controller');

// Apply authentication middleware to all routes
router.use(protect);

router.route('/')
  .post(createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEvent)
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router;