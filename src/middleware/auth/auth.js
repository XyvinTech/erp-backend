const response_handler = require("../../helpers/response_handler");
const { protect } = require("./protect");
const { logger } = require("../logger");
const Role = require("../../models/role_model");

/**
 * Middleware to check if the user is authenticated
 * This middleware uses the protect middleware and just passes through
 * Use this for routes that only require a logged-in user without specific permissions
 */
const isAuthenticated = async (req, res, next) => {
    try {
        // Use the protect middleware first
        return protect(req, res, () => {
            // If we get here, the user is authenticated (either as admin or user)
            logger.info(`Authenticated request from ${req.admin ? 'admin' : 'user'} with ID: ${req.admin ? req.admin._id : req.user._id}`);
            next();
        });
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`, { stack: error.stack });
        return response_handler(res, 500, `Internal Server Error: ${error.message}`);
    }
};

/**
 * Middleware to authorize based on specific permissions
 * This is the main authorization function that should be used for most routes
 * 
 * Usage examples:
 * - authorizePermission("MANAGE_POINTS") - Requires the MANAGE_POINTS permission
 * - authorizePermission(["VIEW_CUSTOMERS", "EDIT_CUSTOMERS"]) - Requires both permissions
 * - authorizePermission() - Just requires authentication (same as isAuthenticated)
 * - authorizePermission("ADMIN") - Special case that only allows admins (same as isAdmin)
 * 
 * @param {Array|String} requiredPermissions - Permission(s) required to access the route
 */
const authorizePermission = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            // Use the protect middleware first for authentication
            return protect(req, res, async () => {
                // Convert string to array if needed
                if (typeof requiredPermissions === 'string') {
                    requiredPermissions = [requiredPermissions];
                }


                // Super Admin check: Skip all permission checks
                    if (req.admin && req.admin.role) {
                    try {
                        const adminRole = await Role.findById(req.admin.role);
                        if (adminRole && adminRole.name === "Super Admin") {
                            logger.info(`Super Admin access granted to user: ${req.admin._id} , ${req.admin.name}`);
                            return next();
                        }
                    } catch (error) {
                        logger.error(`Error checking user role for super_admin: ${error.message}`);
                    }
                }

                // Special case: if permission is "ADMIN", only allow admins
                // if (requiredPermissions.includes("ADMIN")) {
                //     if (!req.admin) {
                //         logger.warn(`Unauthorized admin access attempt by user: ${req.user ? req.user._id : 'unknown'}`);
                //         return response_handler(res, 403, "Access denied. Admin privileges required.");
                //     }
                //     logger.info(`Admin access granted to: ${req.admin._id}`);
                //     return next();
                // }

                // If no permissions required, allow all authenticated users
                if (requiredPermissions.length === 0) {
                    return next();
                }

                // Admin users & check their role if specified
                if (req.admin) {
                    // If admin has a role field, check their role's permissions
                    if (req.admin.role) {
                        try {
                            const adminRole = await Role.findById(req.admin.role);
                            
                            // Add a fallback if role is not found
                            if (!adminRole) {
                                logger.warn(`No role found for admin ${req.admin._id}`);
                                return response_handler(res, 403, "Access denied. Role not found.");
                            }

                            // If role has no permissions defined, deny access
                            if (!adminRole.permissions || adminRole.permissions.length === 0) {
                                logger.warn(`Admin ${req.admin._id} has a role with no permissions`);
                                return response_handler(res, 403, "Access denied. No permissions assigned to role.");
                            }

                            // Check if all required permissions are present
                            const hasAllPermissions = requiredPermissions.every(permission =>
                                adminRole.permissions.includes(permission));

                            if (!hasAllPermissions) {
                                logger.warn(`Admin ${req.admin._id} with role ${adminRole.name} lacks required permissions: ${requiredPermissions.join(', ')}`);
                                return response_handler(res, 403, "Access denied. Insufficient privileges for this operation.");
                            }

                            logger.info(`Admin access granted to: ${req.admin._id} , ${req.admin.name} for restricted route`);
                            return next();

                        } catch (error) {
                            logger.error(`Error checking admin role permissions: ${error.message}`);
                            return response_handler(res, 500, "Internal server error while checking permissions");
                        }
                    } else {
                        // Admin without a role
                        logger.warn(`Admin ${req.admin._id} has no role assigned`);
                        return response_handler(res, 403, "Access denied. No role assigned.");
                    }
                }

              

                // If we get here, the user doesn't have the required permissions
                logger.warn(`Unauthorized permission-based access attempt by user: ${req.user ? req.user._id : 'unknown'}`);
                return response_handler(res, 403, "Access denied. Insufficient privileges for this operation.");
            });
        } catch (error) {
            logger.error(`Authorization error: ${error.message}`, { stack: error.stack });
            return response_handler(res, 500, `Internal Server Error: ${error.message}`);
        }
    };
};

/**
 * Shorthand middleware to check if the user is an admin
 * This is equivalent to authorizePermission("ADMIN")
 */
const isAdmin = async (req, res, next) => {
    return authorizePermission("ADMIN")(req, res, next);
};

module.exports = {
    isAuthenticated,
    isAdmin,
    authorizePermission
}; 