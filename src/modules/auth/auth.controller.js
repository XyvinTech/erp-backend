const User = require('../user/user.model');
const  Employee  = require('../hrm/employee/employee.model');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const jwt = require('jsonwebtoken');
const Role = require('../role/role.model');

const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// const createSendToken = async (user, statusCode, res) => {

//   const roles = await Role.find({ _id: { $in: user.roles } }).select('name');
//   console.log('User roles:', user.roles);
//   const roleNames = roles.map(role => role.name);

//   const token = signToken(user._id, roleNames);
//   console.log(roleNames, "role name")
//   // Remove password from output
//   user.password = undefined;

//   res.status(200).json({
//     status: 'success',
//     data: {
//       user,
//       token
//     }
//   });
// };

const createSendToken = async (employee, statusCode, res) => {
  try {
    // Find employee and populate the role
    employee = await Employee.findById(employee._id)
      .populate({
        path: 'role.role_type',
        select: 'name'
      });
    
    console.log('Employee:', employee);
    console.log('Employee role:', JSON.stringify(employee.role, null, 2));
    
    // Get the role name from the populated role_type
    let roleName = 'Employee'; // Default role
    
    if (employee.role && employee.role.length > 0) {
      // If role is an array of strings, use the first one
      if (typeof employee.role[0] === 'string') {
        roleName = employee.role[0];
      }
      // If role is an array of objects with role_type, use the name
      else if (employee.role[0].role_type && employee.role[0].role_type.name) {
        roleName = employee.role[0].role_type.name;
      }
    }
    
    console.log('Role name being set:', roleName);
    
    // Create token with the role name
    const token = signToken(employee._id, roleName);
    
    // Remove sensitive data
    employee.password = undefined;
    
    res.status(statusCode).json({
      status: 'success',
      data: {
        employee: {
          ...employee.toObject(),
          role: roleName // Send the role name in the response
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error in createSendToken:', error);
    throw error;
  }
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
    role: role || 'employee'
  });

  createSendToken(user, 201, res);
});

/**
 * Login user or employee
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
console.log(req.body, "body");
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
    console.error('Incorrect email or password');
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