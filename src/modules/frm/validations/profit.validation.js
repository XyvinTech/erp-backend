const Joi = require('joi');
const { objectId } = require('../../../validations/custom.validation');

const createProfit = {
  body: Joi.object().keys({
    title: Joi.string().required().min(3).max(200),
    amount: Joi.number().required().min(0),
    date: Joi.date().required(),
    category: Joi.string().required().valid('sales', 'services', 'investments', 'other'),
    description: Joi.string().max(1000),
    source: Joi.string().required(),
    documents: Joi.array().items(
      Joi.object().keys({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().required(),
        uploadDate: Joi.date()
      })
    )
  })
};

const updateProfit = {
  params: Joi.object().keys({
    profitId: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    title: Joi.string().min(3).max(200),
    amount: Joi.number().min(0),
    date: Joi.date(),
    category: Joi.string().valid('sales', 'services', 'investments', 'other'),
    description: Joi.string().max(1000),
    source: Joi.string(),
    status: Joi.string().valid('Pending', 'Verified', 'Rejected'),
    documents: Joi.array().items(
      Joi.object().keys({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().required(),
        uploadDate: Joi.date()
      })
    )
  })
};

const deleteProfit = {
  params: Joi.object().keys({
    profitId: Joi.string().custom(objectId)
  })
};

const getProfit = {
  params: Joi.object().keys({
    profitId: Joi.string().custom(objectId)
  })
};

const getProfits = {
  query: Joi.object().keys({
    title: Joi.string(),
    category: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

module.exports = {
  createProfit,
  updateProfit,
  deleteProfit,
  getProfit,
  getProfits
}; 