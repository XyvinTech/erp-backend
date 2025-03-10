const response_handler = require("../../helpers/response_handler");
const { logger } = require("../../middlewares/logger");
const SDKAccessKey = require("../../models/sdk_access_key_model");
const Customer = require("../../models/customer_model");

/**
 * Middleware to authenticate SDK access keys
 * This middleware validates the access key and attaches client information to the request
 * @param {Array} requiredPermissions - Array of permissions required for this route
 * @returns {Function} - Express middleware
 */
const sdkAuth = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            // Ensure headers exist
            if (!req.headers) {
                logger.warn("SDK API request missing headers");
                return response_handler(res, 400, "Missing request headers");
            }

            // Check for access key in headers
            const accessKey = req.headers["x-access-key"] || req.headers["access-key"];
            if (!accessKey) {
                logger.warn("SDK API request without access key");
                return response_handler(res, 401, "Access key is required for SDK API access");
            }

            // Find the access key in the database
            const keyData = await SDKAccessKey.findOne({ key: accessKey });
            if (!keyData) {
                logger.warn(`Invalid SDK access key attempt: ${accessKey.substring(0, 8)}...`);
                return response_handler(res, 401, "Invalid access key");
            }

            // Check if the key is active
            if (!keyData.active) {
                logger.warn(`Attempt to use revoked SDK key: ${keyData.name}`);
                return response_handler(res, 401, "This SDK key has been revoked");
            }

            // Check if the key has expired
            if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
                logger.warn(`Attempt to use expired SDK key: ${keyData.name}`);
                return response_handler(res, 401, "This SDK key has expired");
            }

            // Check permissions if required
            if (requiredPermissions.length > 0) {
                const hasAllPermissions = requiredPermissions.every(perm =>
                    keyData.permissions.includes(perm)
                );

                if (!hasAllPermissions) {
                    logger.warn(`SDK key ${keyData.name} missing required permissions: ${requiredPermissions.join(', ')}`);
                    return response_handler(res, 403, "This SDK key does not have the required permissions");
                }
            }

            // Attach SDK key data to the request
            req.sdkKey = keyData;

            // Log the access
            logger.info(`SDK API access: ${keyData.name} (${keyData.clientId})`);

            next();
        } catch (error) {
            logger.error(`SDK authentication error: ${error.message}`);
            return response_handler(res, 500, "Authentication error");
        }
    };
};

/**
 * Middleware to check SDK permissions
 * @param {String} permission - The permission to check (user_data, transactions, points, redemptions)
 */
const sdkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            // Check if client information is attached to the request
            if (!req.sdkClient) {
                return response_handler(res, 401, "SDK authentication required");
            }

            // Check if the client has the required permission
            if (!req.sdkClient.permissions[permission]) {
                logger.warn(`SDK client ${req.sdkClient.name} attempted to access ${permission} without permission`);
                return response_handler(res, 403, `Access denied. Your SDK key doesn't have permission for ${permission}`);
            }

            next();
        } catch (error) {
            logger.error(`SDK permission check error: ${error.message}`, { stack: error.stack });
            return response_handler(res, 500, `Internal Server Error: ${error.message}`);
        }
    };
};

/**
 * Middleware to validate user token from SDK requests
 * This middleware validates the user token and attaches the user to the request
 */
const sdkUserAuth = async (req, res, next) => {
    try {
        // Check if client information is attached to the request
        if (!req.sdkClient) {
            return response_handler(res, 401, "SDK authentication required");
        }

        // Check for user token in headers
        const userToken = req.headers["x-user-token"] || req.headers["user-token"];
        if (!userToken) {
            logger.warn(`SDK client ${req.sdkClient.name} attempted to access user data without user token`);
            return response_handler(res, 401, "User token is required for this operation");
        }

        // In a real implementation, you would validate the token
        // For now, we'll just check if the user exists by ID (assuming the token is the user ID)
        const user = await Customer.findById(userToken);
        if (!user) {
            logger.warn(`SDK client ${req.sdkClient.name} attempted to access with invalid user token`);
            return response_handler(res, 401, "Invalid user token");
        }

        // Attach the user to the request
        req.sdkUser = user;

        logger.info(`SDK user access granted for user: ${user._id} via client: ${req.sdkClient.name}`);
        next();
    } catch (error) {
        logger.error(`SDK user authentication error: ${error.message}`, { stack: error.stack });
        return response_handler(res, 500, `Internal Server Error: ${error.message}`);
    }
};

module.exports = {
    sdkAuth,
    sdkPermission,
    sdkUserAuth
}; 