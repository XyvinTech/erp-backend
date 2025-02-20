const Joi = require('joi');
const { createError } = require('../../utils/errors');

/**
 * Validate login request
 */
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
        'string.empty': 'Password cannot be empty'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const message = error.details.map(detail => detail.message).join(', ');
    return next(createError(400, message));
  }
  
  next();
};

/**
 * Validate registration request
 */
exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
        'string.empty': 'Password cannot be empty',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    username: Joi.string()
      .required()
      .min(2)
      .max(50)
      .messages({
        'any.required': 'Username is required',
        'string.empty': 'Username cannot be empty',
        'string.min': 'Username must be at least 2 characters long',
        'string.max': 'Username cannot exceed 50 characters'
      }),
    role: Joi.string()
      .valid('admin', 'user', 'manager')
      .default('user')
      .messages({
        'any.only': 'Role must be either admin, user, or manager'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const message = error.details.map(detail => detail.message).join(', ');
    return next(createError(400, message));
  }
  
  next();
}; 