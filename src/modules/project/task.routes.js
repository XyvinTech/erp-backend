const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  addComment,
  addAttachment,
  updateTask,
  deleteTask
} = require('./task.controller');

// Task routes
router.post('/', auth, createTask);
router.get('/project/:projectId', auth, getProjectTasks);
router.patch('/:taskId/status', auth, updateTaskStatus);
router.post('/:taskId/comments', auth, addComment);
router.post('/:taskId/attachments', auth, addAttachment);
router.patch('/:taskId', auth, updateTask);
router.delete('/:taskId', auth, deleteTask);

module.exports = router; 