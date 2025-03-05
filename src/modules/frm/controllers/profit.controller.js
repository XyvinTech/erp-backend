const Profit = require('../model/Profit');
const ApiError = require('../../../utils/ApiError');
const { uploadFile } = require('../../../utils/fileUpload');

// Create new profit record
const createProfit = async (req, res) => {
  try {
    const files = req.files;
    const documents = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = await uploadFile(file);
        documents.push({
          fileName: file.originalname,
          fileUrl: fileUrl
        });
      }
    }

    const profit = new Profit({
      ...req.body,
      recordedBy: req.user._id,
      documents
    });

    await profit.save();
    res.status(201).json(profit);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get all profit records (with filters)
const getProfits = async (req, res) => {
  try {
    const { status, category, startDate, endDate, source } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const profits = await Profit.find(filter)
      .populate('recordedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ date: -1 });

    res.json(profits);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get profit by ID
const getProfitById = async (req, res) => {
  try {
    const profit = await Profit.findById(req.params.id)
      .populate('recordedBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!profit) {
      throw new ApiError(404, 'Profit record not found');
    }

    res.json(profit);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Update profit record
const updateProfit = async (req, res) => {
  try {
    const profit = await Profit.findById(req.params.id);
    if (!profit) {
      throw new ApiError(404, 'Profit record not found');
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = await uploadFile(file);
        profit.documents.push({
          fileName: file.originalname,
          fileUrl: fileUrl
        });
      }
    }

    Object.assign(profit, req.body);
    await profit.save();
    res.json(profit);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Verify/Reject profit record
const verifyProfit = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Verified', 'Rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be Verified or Rejected');
    }

    const profit = await Profit.findById(req.params.id);
    if (!profit) {
      throw new ApiError(404, 'Profit record not found');
    }

    if (profit.status !== 'Pending') {
      throw new ApiError(400, 'Profit record is already processed');
    }

    profit.status = status;
    profit.verifiedBy = req.user._id;
    profit.verificationDate = new Date();

    await profit.save();
    res.json(profit);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Delete profit record
const deleteProfit = async (req, res) => {
  try {
    const profit = await Profit.findById(req.params.id);
    if (!profit) {
      throw new ApiError(404, 'Profit record not found');
    }

    await profit.remove();
    res.status(204).send();
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get profit statistics
const getProfitStats = async (req, res) => {
  try {
    const stats = await Profit.aggregate([
      {
        $match: {
          status: 'Verified'
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const overall = {
      totalAmount: 0,
      totalCount: 0,
      categoryBreakdown: stats
    };

    stats.forEach(stat => {
      overall.totalAmount += stat.totalAmount;
      overall.totalCount += stat.count;
    });

    res.json(overall);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

module.exports = {
  createProfit,
  getProfits,
  getProfitById,
  updateProfit,
  verifyProfit,
  deleteProfit,
  getProfitStats
};