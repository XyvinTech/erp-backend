const jwt = require('jsonwebtoken');
const Employee = require('../modules/hrm/employee/employee.model');
const Role = require('../modules/role/role.model');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await Employee.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
}; 


exports.authorize = (...permissions) => {
    return async (req, res, next) => {
        if (!req.user?.roles || !Array.isArray(req.user.roles)) {
            return next(createError(401, 'User roles not found'));
        }

        // Fetch all roles assigned to the user
        const roles = await Role.find({ _id: { $in: req.user.roles } });

        if (!roles || roles.length === 0) {
            return next(createError(401, 'Roles not found'));
        }

        // Check if any role has the required permission
        const hasPermission = roles.some(role => permissions.includes(role.name));

        if (!hasPermission) {
            return next(createError(403, 'You are not authorized to access this route'));
        }

        next();
    }   
}

