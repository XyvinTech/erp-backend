const jwt = require('jsonwebtoken');
const { createError } = require('../utils/errors');
const User = require('../modules/user/user.model');
const { Employee } = require('../modules/hrm/employee/employee.model');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
exports.auth = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(createError(401, 'Please log in to access this resource'));
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(createError(401, 'Invalid or expired token'));
    }

    // 3) Check if user or employee still exists
    let user = await User.findById(decoded.id);
    
    // If no user found, try to find employee
    if (!user) {
      user = await Employee.findById(decoded.id);
    }

    if (!user) {
      return next(createError(401, 'User no longer exists'));
    }

    // Skip isActive check for admin users
    if (user?.role !== 'admin' && !user?.isActive) {
      return next(createError(401, 'User account is deactivated'));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(createError(500, 'Error authenticating user'));
  }
};

/**
 * Permission checker middleware factory
 * Checks if user has required permission based on role
 * @param {string} permission - Required permission
 */
exports.checkPermissions = (permission) => {
  return (req, res, next) => {
    try {
      // Admin has all permissions
      if (req.user?.role === 'admin') {
        return next();
      }

      // HR Manager has all HRM permissions
      if (req.user?.role === 'HR Manager' && (
        permission.startsWith('view_') || 
        permission.startsWith('manage_') ||
        permission === 'view_payroll' ||
        permission === 'manage_payroll'
      )) {
        return next();
      }

      // Finance Manager can manage payroll
      if (req.user?.role === 'Finance Manager' && (
        permission === 'view_payroll' ||
        permission === 'manage_payroll'
      )) {
        return next();
      }

      // Allow employees to access their own data
      if (req.params.id && req.user._id.toString() === req.params.id) {
        return next();
      }

      // Allow all employee roles to access their own data
      if (req.path.includes('/me') || 
          req.path.includes('/my-attendance') || 
          req.path.includes('/my-payroll')) {
        return next();
      }

      // Regular employees can only access dashboard and their own data
      if (req.user?.role === 'Employee' && (
        permission === 'view_dashboard' ||
        permission === 'view_profile'
      )) {
        return next();
      }

      return next(createError(403, 'You do not have permission to perform this action'));
    } catch (error) {
      return next(createError(500, 'Error checking permissions'));
    }
  };
};

/**
 * Role checker middleware factory
 * Checks if user has required role
 * @param {...string} roles - Required roles
 */
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user?.role)) {
        return next(createError(403, 'You do not have permission to perform this action'));
      }
      next();
    } catch (error) {
      return next(createError(500, 'Error checking user role'));
    }
  };
};

/**
 * Page access middleware
 * Controls which pages each role can access
 */
exports.checkPageAccess = () => {
  return (req, res, next) => {
    try {
      const path = req.path.toLowerCase();
      const role = req.user?.role;

      // Admin and HR Manager can access all pages
      if (role === 'admin' || role === 'HR Manager') {
        return next();
      }

      // Finance Manager can access payroll pages
      if (role === 'Finance Manager' && path.includes('/payroll')) {
        return next();
      }

      // Regular employees can only access dashboard and their profile
      if (role === 'Employee') {
        if (path.includes('/dashboard') || path.includes('/profile') || path.includes('/my-payroll')) {
          return next();
        }
        return next(createError(403, 'You do not have permission to access this page'));
      }

      return next(createError(403, 'You do not have permission to access this page'));
    } catch (error) {
      return next(createError(500, 'Error checking page access'));
    }
  };
}; 