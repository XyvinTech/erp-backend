const OfficeLoan = require('../model/OfficeLoan');
const { validateOfficeLoan } = require('../validations/officeLoanValidation');
const ApiError = require('../../../utils/ApiError');
const { uploadFile } = require('../../../utils/fileUpload');

// Create new office loan request
const createOfficeLoan = async (req, res) => {
  try {
    const { error } = validateOfficeLoan(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

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

    const loan = new OfficeLoan({
      ...req.body,
      requestedBy: req.user._id,
      requestDate: new Date(),
      documents
    });

    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get all office loans (with filters)
const getOfficeLoans = async (req, res) => {
  try {
    const { status, department, startDate, endDate } = req.query;
    const filter = {};

    // Add filters if provided
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (startDate || endDate) {
      filter.requestDate = {};
      if (startDate) filter.requestDate.$gte = new Date(startDate);
      if (endDate) filter.requestDate.$lte = new Date(endDate);
    }

    // Add user role based filters
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.requestedBy = req.user._id;
    }

    const loans = await OfficeLoan.find(filter)
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name email')
      .sort({ requestDate: -1 });

    res.json(loans);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get office loan by ID
const getOfficeLoanById = async (req, res) => {
  try {
    const loan = await OfficeLoan.findById(req.params.id)
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name email');

    if (!loan) {
      throw new ApiError(404, 'Office loan not found');
    }

    // Check if user has permission to view
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        loan.requestedBy._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to view this loan');
    }

    res.json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Update office loan request
const updateOfficeLoan = async (req, res) => {
  try {
    const loan = await OfficeLoan.findById(req.params.id);
    if (!loan) {
      throw new ApiError(404, 'Office loan not found');
    }

    // Check if user has permission to update
    if (loan.requestedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to update this loan request');
    }

    // Can only update if status is Pending
    if (loan.status !== 'Pending') {
      throw new ApiError(400, 'Cannot update loan request that is already processed');
    }

    const { error } = validateOfficeLoan(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    // Handle new documents if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = await uploadFile(file);
        loan.documents.push({
          fileName: file.originalname,
          fileUrl: fileUrl
        });
      }
    }

    Object.assign(loan, req.body);
    await loan.save();
    res.json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Process loan request (approve/reject)
const processLoanRequest = async (req, res) => {
  try {
    const { status, notes, repaymentPlan } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const loan = await OfficeLoan.findById(req.params.id);
    if (!loan) {
      throw new ApiError(404, 'Office loan not found');
    }

    // Check if user has permission to approve/reject
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      throw new ApiError(403, 'Not authorized to process loan requests');
    }

    // Can only process if status is Pending
    if (loan.status !== 'Pending') {
      throw new ApiError(400, 'Loan request is already processed');
    }

    if (status === 'Approved' && !repaymentPlan) {
      throw new ApiError(400, 'Repayment plan is required for approval');
    }

    loan.status = status;
    loan.approvedBy = req.user._id;
    loan.approvalDate = new Date();
    loan.notes = notes;

    if (status === 'Approved') {
      loan.repaymentPlan = repaymentPlan;
      loan.remainingBalance = loan.amount;
    }

    await loan.save();
    res.json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Record loan payment
const recordPayment = async (req, res) => {
  try {
    const { amount, date, notes } = req.body;
    const loan = await OfficeLoan.findById(req.params.id);

    if (!loan) {
      throw new ApiError(404, 'Office loan not found');
    }

    if (loan.status !== 'Approved') {
      throw new ApiError(400, 'Cannot record payment for unapproved loan');
    }

    if (amount > loan.remainingBalance) {
      throw new ApiError(400, 'Payment amount exceeds remaining balance');
    }

    // Add payment record
    loan.payments.push({
      amount,
      date: date || new Date(),
      notes,
      recordedBy: req.user._id
    });

    // Update remaining balance
    loan.remainingBalance -= amount;

    await loan.save();
    res.json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get loan statistics by department
const getLoanStats = async (req, res) => {
  try {
    const stats = await OfficeLoan.aggregate([
      {
        $match: {
          status: 'Approved'
        }
      },
      {
        $group: {
          _id: '$department',
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 },
          remainingBalance: { $sum: '$remainingBalance' }
        }
      }
    ]);

    const overall = {
      totalAmount: 0,
      totalRemaining: 0,
      totalCount: 0,
      departmentBreakdown: stats
    };

    stats.forEach(stat => {
      overall.totalAmount += stat.totalAmount;
      overall.totalRemaining += stat.remainingBalance;
      overall.totalCount += stat.count;
    });

    res.json(overall);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

module.exports = {
  createOfficeLoan,
  getOfficeLoans,
  getOfficeLoanById,
  updateOfficeLoan,
  processLoanRequest,
  recordPayment,
  getLoanStats
}; 