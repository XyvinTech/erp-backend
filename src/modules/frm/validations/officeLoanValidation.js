const Joi = require('joi');

const officeLoanSchema = Joi.object({
  purpose: Joi.string()
    // .required()
    .min(10)
    .max(1000)
    .messages({
      'string.empty': 'Purpose is required',
      'string.min': 'Purpose must be at least 10 characters long',
      'string.max': 'Purpose cannot exceed 1000 characters'
    }),

  amount: Joi.number()
    .required()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

  department: Joi.string()
    .required()
    .messages({
      'string.empty': 'Department is required',
      'any.required': 'Department is required'
    }),

  justification: Joi.string()
    // .required()
    .min(50)
    .max(2000)
    .messages({
      'string.empty': 'Justification is required',
      'string.min': 'Justification must be at least 50 characters long',
      'string.max': 'Justification cannot exceed 2000 characters'
    }),

  repaymentPlan: Joi.object({
    installments: Joi.number()
      .integer()
      .min(1)
      .max(60)
      .messages({
        'number.base': 'Number of installments must be a number',
        'number.integer': 'Number of installments must be a whole number',
        'number.min': 'Number of installments must be at least 1',
        'number.max': 'Number of installments cannot exceed 60'
      }),
    
    frequency: Joi.string()
      .valid('Monthly', 'Quarterly', 'Annually')
      .messages({
        'any.only': 'Frequency must be Monthly, Quarterly, or Annually'
      }),

    startDate: Joi.date()
      .min('now')
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.min': 'Start date cannot be in the past'
      })
  }).when('status', {
    is: 'Approved',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  documents: Joi.array().items(
    Joi.object({
      fileName: Joi.string().required(),
      fileUrl: Joi.string().required().uri(),
      type: Joi.string().valid('Quotation', 'Invoice', 'Other').required()
    })
  ).min(1).messages({
    'array.min': 'At least one supporting document is required'
  }),

  notes: Joi.string()
    .max(1000)
    .allow('')
    .default('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),

  status: Joi.string()
    .valid('Pending', 'Approved', 'Rejected')
    .default('Pending')
    .messages({
      'any.only': 'Status must be Pending, Approved, or Rejected'
    })
});

const validateOfficeLoan = (data) => {
  return officeLoanSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateOfficeLoan
}; 