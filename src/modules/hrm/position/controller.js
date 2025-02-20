const { Position } = require('../models');
const { createError, catchAsync } = require('../../../utils/errors');

/**
 * Get all positions
 */
exports.getAllPositions = catchAsync(async (req, res) => {
  const positions = await Position.find({ isActive: true })
    .populate('department', 'name code')
    .populate('createdBy', 'name email');

  res.status(200).json({
    status: 'success',
    results: positions.length,
    data: { positions }
  });
});

/**
 * Get position by ID
 */
exports.getPositionById = catchAsync(async (req, res) => {
  const position = await Position.findById(req.params.id)
    .populate('department', 'name code')
    .populate('createdBy', 'name email')
    .populate('employees');

  if (!position) {
    throw createError(404, 'Position not found');
  }

  res.status(200).json({
    status: 'success',
    data: { position }
  });
});

/**
 * Create new position
 */
exports.createPosition = catchAsync(async (req, res) => {
  const {
    title,
    code,
    department,
    description,
    responsibilities,
    requirements,
    salaryRange
  } = req.body;

  const position = await Position.create({
    title,
    code,
    department,
    description,
    responsibilities,
    requirements,
    salaryRange,
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: { position }
  });
});

/**
 * Update position
 */
exports.updatePosition = catchAsync(async (req, res) => {
  const {
    title,
    description,
    responsibilities,
    requirements,
    salaryRange,
    isActive
  } = req.body;

  const position = await Position.findById(req.params.id);
  if (!position) {
    throw createError(404, 'Position not found');
  }

  // Don't allow updating code or department if there are employees
  if (position.employeeCount > 0 && (req.body.code || req.body.department)) {
    throw createError(400, 'Cannot update code or department while position has employees');
  }

  const updatedPosition = await Position.findByIdAndUpdate(
    req.params.id,
    {
      title,
      code: req.body.code,
      department: req.body.department,
      description,
      responsibilities,
      requirements,
      salaryRange,
      isActive
    },
    { new: true, runValidators: true }
  )
    .populate('department', 'name code')
    .populate('createdBy', 'name email');

  res.status(200).json({
    status: 'success',
    data: { position: updatedPosition }
  });
});

/**
 * Delete position
 */
exports.deletePosition = catchAsync(async (req, res) => {
  const position = await Position.findById(req.params.id);
  
  if (!position) {
    throw createError(404, 'Position not found');
  }

  if (position.employeeCount > 0) {
    throw createError(400, 'Cannot delete position with active employees');
  }

  await position.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
}); 