const PersonalLoan = require('../model/PersonalLoan');
const { validatePersonalLoan } = require('../validations/personalLoanValidation');
const ApiError = require('../../../utils/ApiError');
const { uploadFile } = require('../../../utils/fileUpload');

// Create new personal loan application
const createPersonalLoan = async (req, res) => {
  try {
    const { error } = validatePersonalLoan(req.body);
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

    const loan = new PersonalLoan({
      ...req.body,
      applicant: req.user._id,
      documents
    });

    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get all personal loans (with filters)
const getPersonalLoans = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    // Add filters if provided
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Add user role based filters
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.applicant = req.user._id;
    }

    const loans = await PersonalLoan.find(filter)
      .populate('applicant', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(loans);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get personal loan by ID
const getPersonalLoanById = async (req, res) => {
  try {
    const loan = await PersonalLoan.findById(req.params.id)
      .populate('applicant', 'name email')
      .populate('approvedBy', 'name email');

    if (!loan) {
      throw new ApiError(404, 'Personal loan not found');
    }

    // Check if user has permission to view
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        loan.applicant._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to view this loan');
    }

    res.json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Update personal loan
const updatePersonalLoan = async (req, res) => {
  try {
    const loan = await PersonalLoan.findById(req.params.id);
    if (!loan) {
      throw new ApiError(404, 'Personal loan not found');
    }

    // Check if user has permission to update
    if (loan.applicant.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to update this loan');
    }

    // Can only update if status is Pending
    if (loan.status !== 'Pending') {
      throw new ApiError(400, 'Cannot update loan that is already processed');
    }

    const { error } = validatePersonalLoan(req.body);
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

// Process loan application (approve/reject)
const processLoanApplication = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const loan = await PersonalLoan.findById(req.params.id);
    if (!loan) {
      throw new ApiError(404, 'Personal loan not found');
    }

    // Check if user has permission to approve/reject
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      throw new ApiError(403, 'Not authorized to process loans');
    }

    // Can only process if status is Pending
    if (loan.status !== 'Pending') {
      throw new ApiError(400, 'Loan is already processed');
    }

    loan.status = status;
    loan.approvedBy = req.user._id;
    loan.approvalDate = new Date();

    if (status === 'Approved') {
      // Set next payment date to one month from approval
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);
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
    const { amount, date } = req.body;
    const loan = await PersonalLoan.findById(req.params.id);

    if (!loan) {
      throw new ApiError(404, 'Personal loan not found');
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
      status: 'Paid'
    });

    // Update remaining balance
    loan.remainingBalance -= amount;

    // Update next payment date
    if (loan.remainingBalance > 0) {
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);
    }

    await loan.save();
    res.json(loan);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

// Get loan statistics
const getLoanStats = async (req, res) => {
  try {
    const stats = await PersonalLoan.aggregate([
      {
        $match: {
          status: 'Approved',
          ...(req.user.role !== 'admin' && req.user.role !== 'manager' 
              ? { applicant: req.user._id } 
              : {})
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayable: { $sum: '$totalPayable' },
          averageInterestRate: { $avg: '$interestRate' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats[0] || {
      totalAmount: 0,
      totalPayable: 0,
      averageInterestRate: 0,
      count: 0
    });
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

module.exports = {
  createPersonalLoan,
  getPersonalLoans,
  getPersonalLoanById,
  updatePersonalLoan,
  processLoanApplication,
  recordPayment,
  getLoanStats
}; 