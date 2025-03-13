const User = require('./user.model');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { createError } = require('../../utils/errors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Register new user
exports.register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError(400, 'User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// Login user
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    throw createError(400, 'Please provide email and password');
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw createError(401, 'Incorrect email or password');
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// Get current user
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Update current user
exports.updateMe = catchAsync(async (req, res) => {
  // Create error if user tries to update password
  if (req.body.password) {
    throw createError(400, 'This route is not for password updates. Please use /update-password');
  }

  // Filter unwanted fields
  const filteredBody = {
    name: req.body.name,
    email: req.body.email,
  };

  // Update user
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Update password
exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw createError(401, 'Your current password is wrong');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'Password updated successfully',
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res) => {
  // Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw createError(404, 'There is no user with that email address');
  }

  // Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send token to user's email (implement email sending logic here)
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email',
    resetToken, // Remove this in production
  });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    throw createError(400, 'Token is invalid or has expired');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'Password reset successfully',
  });
});

// Admin Controllers
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw createError(404, 'No user found with that ID');
  }
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.createUser = catchAsync(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { user },
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw createError(404, 'No user found with that ID');
  }
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw createError(404, 'No user found with that ID');
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
}); 