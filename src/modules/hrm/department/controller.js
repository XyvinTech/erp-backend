const { Department } = require('../models');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Get all departments
 */
const getAllDepartments = catchAsync(async (req, res, next) => {
  const departments = await Department.find();
  
  res.status(200).json({
    status: 'success',
    data: { departments }
  });
});

/**
 * Get department by ID
 */
const getDepartmentById = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('manager', 'firstName lastName email')
    .populate('parentDepartment', 'name code');

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { department }
  });
});

/**
 * Create new department
 */
const createDepartment = catchAsync(async (req, res, next) => {
  const { name, code, description, manager, parentDepartment, budget, location } = req.body;

  // Check if department with same name or code exists
  const existingDepartment = await Department.findOne({ $or: [{ name }, { code }] });
  if (existingDepartment) {
    return next(new AppError('Department with this name or code already exists', 400));
  }

  const department = await Department.create({
    name,
    code,
    description,
    manager,
    parentDepartment,
    budget,
    location,
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: { department }
  });
});

/**
 * Update department
 */
const updateDepartment = catchAsync(async (req, res, next) => {
  const { name, description, manager, parentDepartment, budget, location, isActive } = req.body;

  // Check if department with same name exists (excluding current department)
  if (name) {
    const existingDepartment = await Department.findOne({
      name,
      _id: { $ne: req.params.id }
    });
    if (existingDepartment) {
      return next(new AppError('Department with this name already exists', 400));
    }
  }

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { name, description, manager, parentDepartment, budget, location, isActive },
    { new: true, runValidators: true }
  )
    .populate('manager', 'firstName lastName email')
    .populate('parentDepartment', 'name code');

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { department }
  });
});

/**
 * Delete department
 */
const deleteDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Check if department has employees
  if (department.employeeCount > 0) {
    return next(new AppError('Cannot delete department with active employees', 400));
  }

  await department.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Department deleted successfully'
  });
});

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
}; 