const Project = require('../../models/project.model');
const { validateProject } = require('./project.validation');

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { error } = validateProject(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = new Project({
      ...req.body,
      createdBy: req.user._id
    });

    await project.save();
    
    // Populate after save
    const populatedProject = await Project.findById(project._id)
      .populate('client', 'name company')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      });

    // Transform project data
    const transformedProject = {
      ...populatedProject.toObject(),
      team: populatedProject.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };
      
    res.status(201).json(transformedProject);
  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name company email phone')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'tasks',
        populate: [
          {
            path: 'assignee',
            select: 'firstName lastName email position'
          },
          {
            path: 'comments',
            populate: {
              path: 'author',
              select: 'firstName lastName email'
            }
          },
          {
            path: 'attachments'
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Transform team data for all projects
    const transformedProjects = projects.map(project => ({
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      })),
      tasks: project.tasks.map(task => ({
        ...task.toObject(),
        assignee: task.assignee ? {
          id: task.assignee._id,
          name: `${task.assignee.firstName} ${task.assignee.lastName}`,
          firstName: task.assignee.firstName,
          lastName: task.assignee.lastName,
          email: task.assignee.email,
          position: task.assignee.position
        } : null,
        comments: task.comments?.map(comment => ({
          ...comment,
          author: comment.author ? {
            id: comment.author._id,
            name: `${comment.author.firstName} ${comment.author.lastName}`,
            email: comment.author.email
          } : null
        }))
      }))
    }));

    res.json(transformedProjects);
  } catch (error) {
    console.error('Error in getProjects:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name company email phone')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'tasks',
        select: 'title description status priority dueDate assignee',
        populate: {
          path: 'assignee',
          select: 'firstName lastName email'
        }
      });
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Transform team data to match expected format
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in getProject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { error } = validateProject(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    )
    .populate('client', 'name company')
    .populate({
      path: 'team',
      select: 'firstName lastName email position department role status',
      populate: [
        {
          path: 'position',
          select: 'title code description'
        },
        {
          path: 'department',
          select: 'name'
        }
      ]
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Transform project data
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign team to project
exports.assignTeam = async (req, res) => {
  try {
    const { employees } = req.body;
    
    if (!Array.isArray(employees)) {
      return res.status(400).json({ message: 'Employees must be an array of IDs' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { team: employees },
      { new: true }
    )
    .populate('client', 'name company')
    .populate({
      path: 'team',
      select: 'firstName lastName email position department role status',
      populate: [
        {
          path: 'position',
          select: 'title code description'
        },
        {
          path: 'department',
          select: 'name'
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Transform team data to match expected format
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in assignTeam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get project details
exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name company email phone')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'tasks',
        select: 'title description status priority dueDate assignee comments attachments',
        populate: [
          {
            path: 'assignee',
            select: 'firstName lastName email position'
          },
          {
            path: 'comments.author',
            select: 'firstName lastName email'
          }
        ]
      });
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Transform project data
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      })),
      tasks: project.tasks.map(task => ({
        ...task,
        assignee: task.assignee ? {
          id: task.assignee._id,
          name: `${task.assignee.firstName} ${task.assignee.lastName}`,
          firstName: task.assignee.firstName,
          lastName: task.assignee.lastName,
          email: task.assignee.email,
          position: task.assignee.position
        } : null,
        comments: task.comments?.map(comment => ({
          ...comment,
          author: comment.author ? {
            id: comment.author._id,
            name: `${comment.author.firstName} ${comment.author.lastName}`,
            email: comment.author.email
          } : null
        }))
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in getProjectDetails:', error);
    res.status(500).json({ message: error.message });
  }
}; 