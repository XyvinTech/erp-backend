const User = require('../user/user.model');
const { Employee } = require('../hrm/employee/employee.model');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const jwt = require('jsonwebtoken');

const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  
  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    data: {
      user,
      token
    }
  });
};

/**
 * Register a new user
 */
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, username, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError('Email already registered', 400));
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    username,
    role: role || 'user'
  });

  createSendToken(user, 201, res);
});

/**
 * Login user or employee
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new ApiError('Please provide email and password', 400));
  }

  // First try to find a user
  let user = await User.findOne({ email }).select('+password');
  let isPasswordValid = false;

  // If user found, verify password using comparePassword
  if (user) {
    isPasswordValid = await user.comparePassword(password);
  } else {
    // If no user found, try to find an employee
    user = await Employee.findOne({ email }).select('+password');
    if (user) {
      isPasswordValid = await user.matchPassword(password);
    }
  }

  // If neither user nor employee found, or password doesn't match
  if (!user || !isPasswordValid) {
    return next(new ApiError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

/**
 * Get current user profile
 */
exports.getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update user profile
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updatePassword', 400));
  }

  // 2) Filter out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Update user password
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password
  user.password = req.body.newPassword;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

/**
 * Logout user
 */
exports.logout = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
}); 