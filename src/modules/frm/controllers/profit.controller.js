const httpStatus = require('http-status');
const catchAsync = require('../../../utils/catchAsync');
const { profitService } = require('../services');
const ApiError = require('../../../utils/ApiError');
const pick = require('../../../utils/pick');

const createProfit = catchAsync(async (req, res) => {
  const profit = await profitService.createProfit({
    ...req.body,
    recordedBy: req.user.id,
    profitNumber: await profitService.generateProfitNumber()
  });
  res.status(httpStatus.CREATED).send(profit);
});

const getProfits = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'category', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await profitService.queryProfits(filter, options);
  res.send(result);
});

const getProfit = catchAsync(async (req, res) => {
  const profit = await profitService.getProfitById(req.params.profitId);
  if (!profit) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profit not found');
  }
  res.send(profit);
});

const updateProfit = catchAsync(async (req, res) => {
  const profit = await profitService.updateProfitById(req.params.profitId, {
    ...req.body,
    verifiedBy: req.body.status === 'Verified' ? req.user.id : undefined,
    verificationDate: req.body.status === 'Verified' ? new Date() : undefined
  });
  res.send(profit);
});

const deleteProfit = catchAsync(async (req, res) => {
  await profitService.deleteProfitById(req.params.profitId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getProfitStats = catchAsync(async (req, res) => {
  const stats = await profitService.getProfitStatistics();
  res.send(stats);
});

module.exports = {
  createProfit,
  getProfits,
  getProfit,
  updateProfit,
  deleteProfit,
  getProfitStats
}; 