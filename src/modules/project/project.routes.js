const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  assignTeam,
  getProjectDetails
} = require('./project.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect)

router.post('/',  createProject);
router.get('/',  getProjects);
router.get('/:id',  getProject);
router.get('/:id/details', getProjectDetails);
router.put('/:id', updateProject);
router.delete('/:id',  deleteProject);
router.post('/:id/assign-team',  assignTeam);

module.exports = router; 