const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  assignTeam
} = require('./project.controller');

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProject);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);
router.post('/:id/assign-team', auth, assignTeam);

module.exports = router; 