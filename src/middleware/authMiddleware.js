const jwt = require('jsonwebtoken');
const Employee = require('../modules/hrm/employee/employee.model');
const Role = require('../modules/role/role.model');
const ApiError = require('../utils/ApiError');

// exports.protect = async (req, res, next) => {
//     try {
//         let token;

//         // Check if token exists in headers
//         if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//             token = req.headers.authorization.split(' ')[1];
//         }

//         if (!token) {
//             return res.status(401).json({ message: 'Not authorized to access this route' });
//         }

//         try {
//             // Verify token
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             // Get user from token
//             req.user = await Employee.findById(decoded.id).select('-password');
            
//             if (!req.user) {
//                 return res.status(401).json({ message: 'User not found' });
//             }

//             next();
//         } catch (error) {
//             return res.status(401).json({ message: 'Not authorized to access this route' });
//         }
//     } catch (error) {
//         return res.status(500).json({ message: 'Server Error' });
//     }
// }; 


exports.protect = async (req, res, next) => {
    try {
      let token;
  
      // Check if token exists in headers
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
  
      if (!token) {
        return next(new ApiError('Not authorized to access this route', 401));
      }
  
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
  
        // Get user from token
        req.user = await Employee.findById(decoded.id).select('-password');
        
        // Set the role from the token
        req.user.role = decoded.role;
        console.log('User role from token:', req.user.role);
  
        if (!req.user) {
          return next(new ApiError('User not found', 401));
        }
  
        next();
      } catch (error) {
        return next(new ApiError('Not authorized to access this route', 401));
      }
    } catch (error) {
      return next(new ApiError('Server Error', 500));
    }
  };

exports.authorize = (...permissions) => {
    return async (req, res, next) => {
        try {
            console.log('Checking permissions for role:', req.user?.role);
            console.log('Required permissions:', permissions);
            
            if (!req.user?.role) {
                return next(new ApiError('User role not found', 401));
            }

            // Handle both array and string roles
            const userRole = Array.isArray(req.user.role) ? req.user.role[0] : req.user.role;
            console.log('User role after processing:', userRole);

            // Check if user's role matches any of the required permissions
            const hasPermission = permissions.includes(userRole);
            console.log('Has permission:', hasPermission);

            if (!hasPermission) {
                return next(new ApiError('You are not authorized to access this route', 403));
            }

            next();
        } catch (error) {
            console.error('Error in authorize middleware:', error);
            return next(new ApiError('Error checking permissions', 500));
        }
    }   
}

