const jwt = require('jsonwebtoken');
const Employee = require('../modules/hrm/employee/employee.model');
const Role = require('../modules/role/role.model');
const { JWT_SECRET } = require('../config/env');

exports.protect = async (req, res, next) => {
  try {
    console.log(req.headers.authorization, "header")
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).send('Not authorized to access this route')
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded);

      // Get user from token with role information
      req.user = await Employee.findById(decoded.id)
        .select('-password')
        .populate({
          path: 'role.role_type',
          model: 'Role',
          select: 'name description'
        });

      if (!req.user) {
        res.status(401).send('User not found')
      }

      // Add roles from token to user object
      req.user.tokenRoles = decoded.roles;
      console.log('User roles from token:', req.user.tokenRoles);
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).send('Not authorized to access this route')
    }
  } catch (error) {
    console.error('Protect middleware error:', error);
    res.status(500).send('Server Error')
  }
};

exports.authorize = (...roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role || req.user.role.length === 0) {
        console.log('No roles found for user');
        res.status(403).send("User has no roles assigned")
      }

      console.log('User roles:', req.user.role);
      console.log('Required roles:', roleNames);

      // Extract role names from the populated role objects
      const userRoleNames = req.user.role.map(roleObj => {
        // Handle both populated and non-populated role objects
        if (roleObj.role_type && typeof roleObj.role_type === 'object') {
          return roleObj.role_type.name;
        } else {
          // If role_type is not populated, we need to get the role name
          return roleObj.type;
        }
      });

      console.log('User role names:', userRoleNames);

      // Check if the user has any of the required roles
      const hasRequiredRole = userRoleNames.some(roleName => roleNames.includes(roleName));

      if (!hasRequiredRole) {
        console.log('User does not have required roles');
        res.status(403).send('User does not have required roles')
      }

      console.log('Authorization successful');
      next();
    } catch (error) {
      console.error('Authorize middleware error:', error);
      res.status(500).send('Error checking permissions')
    }
  };
};

