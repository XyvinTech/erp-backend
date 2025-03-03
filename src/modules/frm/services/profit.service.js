const httpStatus = require('http-status');
const { Profit } = require('../model');
const ApiError = require('../../../utils/ApiError');
const { getQueryOptions } = require('../../../utils/query');

/**
 * Generate a unique profit number
 * @returns {Promise<string>}
 */
const generateProfitNumber = async () => {
  const count = await Profit.countDocuments();
  const year = new Date().getFullYear().toString().substr(-2);
  return `PRF${year}${(count + 1).toString().padStart(4, '0')}`;
};

/**
 * Create a profit record
 * @param {Object} profitBody
 * @returns {Promise<Profit>}
 */
const createProfit = async (profitBody) => {
  return Profit.create(profitBody);
};

/**
 * Query for profits
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryProfits = async (filter, options) => {
  const profits = await Profit.find(filter)
    .sort(options.sortBy || '-createdAt')
    .skip(options.skip)
    .limit(options.limit)
    .populate('recordedBy', 'name')
    .populate('verifiedBy', 'name');

  const count = await Profit.countDocuments(filter);

  return {
    results: profits,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(count / options.limit),
    totalResults: count,
  };
};

/**
 * Get profit by id
 * @param {ObjectId} id
 * @returns {Promise<Profit>}
 */
const getProfitById = async (id) => {
  return Profit.findById(id)
    .populate('recordedBy', 'name')
    .populate('verifiedBy', 'name');
};

/**
 * Update profit by id
 * @param {ObjectId} profitId
 * @param {Object} updateBody
 * @returns {Promise<Profit>}
 */
const updateProfitById = async (profitId, updateBody) => {
  const profit = await getProfitById(profitId);
  if (!profit) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profit not found');
  }
  Object.assign(profit, updateBody);
  await profit.save();
  return profit;
};

/**
 * Delete profit by id
 * @param {ObjectId} profitId
 * @returns {Promise<Profit>}
 */
const deleteProfitById = async (profitId) => {
  const profit = await getProfitById(profitId);
  if (!profit) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profit not found');
  }
  await profit.remove();
  return profit;
};

/**
 * Get profit statistics
 * @returns {Promise<Object>}
 */
const getProfitStatistics = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [totalStats, monthlyStats, yearlyStats] = await Promise.all([
    Profit.aggregate([
      {
        $match: { status: 'Verified' }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]),
    Profit.aggregate([
      {
        $match: {
          status: 'Verified',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]),
    Profit.aggregate([
      {
        $match: {
          status: 'Verified',
          date: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    total: {
      amount: totalStats[0]?.totalAmount || 0,
      count: totalStats[0]?.count || 0
    },
    monthly: {
      amount: monthlyStats[0]?.totalAmount || 0,
      count: monthlyStats[0]?.count || 0
    },
    yearly: {
      amount: yearlyStats[0]?.totalAmount || 0,
      count: yearlyStats[0]?.count || 0
    }
  };
};

module.exports = {
  createProfit,
  queryProfits,
  getProfitById,
  updateProfitById,
  deleteProfitById,
  generateProfitNumber,
  getProfitStatistics
}; 