const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../hrm/employee/employee.model');
const Role = require('../role/role.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');
const { logger } = require('../../middleware/logger');
const crypto = require('crypto');

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email); // Debug log

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const employee = await Employee.findOne({ email }).select('+password');
    console.log('Employee found:', employee ? 'Yes' : 'No'); // Debug log

    if (!employee) {
      logger.warn(`Login attempt with invalid email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      logger.warn(`Login attempt by inactive employee: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    // Check if password matches
    const isMatch = await employee.matchPassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No'); // Debug log

    if (!isMatch) {
      logger.warn(`Login attempt with invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = await generateToken(employee._id);

    // Get role details
    let roleDetails = [];
    if (employee.role && employee.role.length > 0) {
      const roleIds = employee.role.map(r => r.role_type);
      const roles = await Role.find({ _id: { $in: roleIds } });
      roleDetails = roles.map(role => ({
        id: role._id,
        name: role.name
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        profilePicture: employee.profilePicture,
        roles: roleDetails,
        department: employee.department,
        position: employee.position
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    logger.error(`Error in login: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Register new employee
 * @route   POST /api/v1/auth/register
 * @access  Private (Admin only)
 */
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department,
      position,
      phone,
      joiningDate,
      salary,
      roles
    } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email or ID already exists'
      });
    }

    // Validate roles if provided
    let roleObjects = [];
    if (roles && roles.length > 0) {
      const validRoles = await Role.find({ _id: { $in: roles } });

      if (validRoles.length !== roles.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more role IDs are invalid'
        });
      }

      roleObjects = roles.map(roleId => {
        const role = validRoles.find(r => r._id.toString() === roleId.toString());
        return {
          type: role.name,
          role_type: roleId
        };
      });
    } else {
      // Default to basic employee role if none provided
      const defaultRole = await Role.findOne({ name: 'Employee' });
      if (defaultRole) {
        roleObjects = [{
          type: 'Employee',
          role_type: defaultRole._id
        }];
      }
    }

    // Create employee
    const employee = await Employee.create({
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department,
      position,
      phone,
      joiningDate: joiningDate || new Date(),
      salary,
      role: roleObjects,
      status: 'active'
    });

    // Get role details for response
    const roleIds = employee.role.map(r => r.role_type);
    const roleDetails = await Role.find({ _id: { $in: roleIds } });
    const rolesForResponse = roleDetails.map(role => ({
      id: role._id,
      name: role.name
    }));

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        roles: rolesForResponse
      }
    });
  } catch (error) {
    logger.error(`Error in register: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .populate('department', 'name')
      .populate('position', 'name');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get role details
    let roleDetails = [];
    if (employee.role && employee.role.length > 0) {
      const roleIds = employee.role.map(r => r.role_type);
      const roles = await Role.find({ _id: { $in: roleIds } });
      roleDetails = roles.map(role => ({
        id: role._id,
        name: role.name
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        email: employee.email,
        profilePicture: employee.profilePicture,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        joiningDate: employee.joiningDate,
        status: employee.status,
        roles: roleDetails
      }
    });
  } catch (error) {
    logger.error(`Error in getMe: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Check current password
    const employee = await Employee.findById(req.user.id).select('+password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const isMatch = await employee.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error(`Error in updatePassword: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee found with that email'
      });
    }

    // Generate reset token (would typically send via email)
    const resetToken = generateResetToken();

    // Store hashed token in database with expiry
    employee.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    employee.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await employee.save({ validateBeforeSave: false });

    // In a real application, you would send an email with the reset link
    // For this example, we'll just return the token in the response
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // In production, don't return this directly
    });
  } catch (error) {
    logger.error(`Error in forgotPassword: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
};

// Helper function to generate JWT token
const generateToken = async (id) => {
  try {
    // Get employee with role information
    const employee = await Employee.findById(id)
      .populate({
        path: 'role.role_type',
        model: 'Role',
        select: 'name description'
      });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Extract role information
    const roles = employee.role.map(roleObj => ({
      type: roleObj.type,
      role_type: roleObj.role_type._id,
      name: roleObj.role_type.name
    }));
 console.log(roles, "role")
    // Create token with role information
    return jwt.sign(
      { 
        id,
        roles 
      }, 
      JWT_SECRET, 
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// Helper function to generate reset token
const generateResetToken = () => {
  // Generate random bytes
  const resetToken = crypto.randomBytes(20).toString('hex');
  return resetToken;
};
