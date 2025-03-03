const Joi = require('joi');

const personalLoanSchema = Joi.object({
  purpose: Joi.string()
    .required()
    .min(10)
    .max(500)
    .messages({
      'string.empty': 'Purpose is required',
      'string.min': 'Purpose must be at least 10 characters long',
      'string.max': 'Purpose cannot exceed 500 characters'
    }),

  amount: Joi.number()
    .required()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

  term: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(60)
    .messages({
      'number.base': 'Term must be a number',
      'number.integer': 'Term must be a whole number',
      'number.min': 'Term must be at least 1 month',
      'number.max': 'Term cannot exceed 60 months',
      'any.required': 'Term is required'
    }),

  interestRate: Joi.number()
    .required()
    .min(0)
    .max(30)
    .messages({
      'number.base': 'Interest rate must be a number',
      'number.min': 'Interest rate cannot be negative',
      'number.max': 'Interest rate cannot exceed 30%',
      'any.required': 'Interest rate is required'
    }),

  employmentType: Joi.string()
    .required()
    .valid('Full-time', 'Part-time', 'Contract')
    .messages({
      'any.only': 'Employment type must be Full-time, Part-time, or Contract',
      'any.required': 'Employment type is required'
    }),

  monthlyIncome: Joi.number()
    .required()
    .positive()
    .messages({
      'number.base': 'Monthly income must be a number',
      'number.positive': 'Monthly income must be positive',
      'any.required': 'Monthly income is required'
    }),

  existingLoans: Joi.array().items(
    Joi.object({
      lender: Joi.string().required(),
      amount: Joi.number().required().positive(),
      remainingBalance: Joi.number().required().min(0),
      monthlyPayment: Joi.number().required().positive()
    })
  ).default([]),

  documents: Joi.array().items(
    Joi.object({
      fileName: Joi.string().required(),
      fileUrl: Joi.string().required().uri()
    })
  ).default([])
});

const validatePersonalLoan = (data) => {
  return personalLoanSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validatePersonalLoan
}; 