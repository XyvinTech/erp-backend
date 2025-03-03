const Expense = require('../model/Expense');
const { validateExpense } = require('../validations/expenseValidation');
const ApiError = require('../../../utils/ApiError');
const { uploadFile } = require('../../../utils/fileUpload');

/**
 * Generate expense number
 */
const generateExpenseNumber = async () => {
  try {
    console.log('Starting expense number generation...');
    // Get all expenses and sort by expenseNumber in descending order
    const expenses = await Expense.find({})
      .sort({ expenseNumber: -1 })
      .limit(1)
      .lean();

    console.log('Latest expense:', expenses[0]);

    if (!expenses || expenses.length === 0) {
      console.log('No expenses found, starting with EXP001');
      return 'EXP001';
    }

    const latestExpense = expenses[0];
    console.log('Latest expense number:', latestExpense.expenseNumber);
    
    // Extract the numeric part
    const matches = latestExpense.expenseNumber.match(/EXP(\d+)/);
    
    if (!matches || !matches[1]) {
      console.log('Invalid number format, starting with EXP001');
      return 'EXP001';
    }

    const currentNumber = parseInt(matches[1], 10);
    if (isNaN(currentNumber)) {
      console.log('Invalid number format, starting with EXP001');
      return 'EXP001';
    }

    const nextNumber = currentNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const generatedNumber = `EXP${paddedNumber}`;
    
    console.log('Generated next number:', generatedNumber);
    return generatedNumber;

  } catch (error) {
    console.error('Error generating expense number:', error);
    throw new Error('Failed to generate expense number');
  }
};

// Create new expense
const createExpense = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return next(new ApiError(401, 'User not authenticated'));
    }

    // Generate expense number
    const expenseNumber = await generateExpenseNumber();

    // Validate request body
    const { error } = validateExpense(req.body);
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    // Convert amount to number
    const expenseData = {
      ...req.body,
      expenseNumber,
      amount: Number(req.body.amount)
    };

    // Handle file uploads if any
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

    // Create and save expense
    const expense = new Expense({
      ...expenseData,
      submittedBy: req.user._id,
      documents
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Expense creation error:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error creating expense'));
  }
};

// Get next expense number
const getNextExpenseNumber = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return next(new ApiError(401, 'User not authenticated'));
    }

    console.log('Generating next expense number...');
    
    // Get all expenses and sort by expenseNumber in descending order
    const latestExpense = await Expense.findOne({})
      .sort({ expenseNumber: -1 })
      .select('expenseNumber')
      .lean();

    console.log('Latest expense:', latestExpense);

    let nextNumber = 'EXP001';

    if (latestExpense && latestExpense.expenseNumber) {
      console.log('Latest expense number:', latestExpense.expenseNumber);
      
      // Extract the numeric part
      const matches = latestExpense.expenseNumber.match(/EXP(\d+)/);
      
      if (matches && matches[1]) {
        const currentNumber = parseInt(matches[1], 10);
        if (!isNaN(currentNumber)) {
          const newNumber = currentNumber + 1;
          nextNumber = `EXP${newNumber.toString().padStart(3, '0')}`;
        }
      }
    }

    console.log('Generated next number:', nextNumber);
    
    return res.status(200).json({
      success: true,
      data: {
        expense: {
          expenseNumber: nextNumber
        }
      }
    });
  } catch (error) {
    console.error('Error in getNextExpenseNumber:', error);
    return next(new ApiError(500, 'Failed to generate expense number'));
  }
};

// Get all expenses (with filters)
const getExpenses = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return next(new ApiError(401, 'User not authenticated'));
    }

    const { status, category, startDate, endDate } = req.query;
    const filter = {};

    // Add filters if provided
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Add user role based filters
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.submittedBy = req.user._id;
    }

    console.log('Expense filter:', filter); // Add logging for debugging

    const expenses = await Expense.find(filter)
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error fetching expenses'));
  }
};

// Get expense by ID
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return next(new ApiError(404, 'Expense not found'));
    }

    // Check if user has permission to view
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        expense.submittedBy._id.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized to view this expense'));
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error fetching expense'));
  }
};

// Update expense
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return next(new ApiError(404, 'Expense not found'));
    }

    // Check if user has permission to update
    if (expense.submittedBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized to update this expense'));
    }

    // Can only update if status is Pending
    if (expense.status !== 'Pending') {
      return next(new ApiError(400, 'Cannot update expense that is already processed'));
    }

    const { error } = validateExpense(req.body);
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    // Handle new documents if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = await uploadFile(file);
        expense.documents.push({
          fileName: file.originalname,
          fileUrl: fileUrl
        });
      }
    }

    Object.assign(expense, req.body);
    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error updating expense'));
  }
};

// Delete expense
const deleteExpense = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return next(new ApiError(401, 'User not authenticated'));
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return next(new ApiError(404, 'Expense not found'));
    }

    // Check if user has permission to delete
    if (expense.submittedBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized to delete this expense'));
    }

    // Can only delete if status is Pending
    if (expense.status !== 'Pending') {
      return next(new ApiError(400, 'Cannot delete expense that is already processed'));
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error deleting expense'));
  }
};

// Approve or reject expense
const processExpense = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return next(new ApiError(400, 'Invalid status'));
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return next(new ApiError(404, 'Expense not found'));
    }

    // Check if user has permission to approve/reject
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return next(new ApiError(403, 'Not authorized to process expenses'));
    }

    // Can only process if status is Pending
    if (expense.status !== 'Pending') {
      return next(new ApiError(400, 'Expense is already processed'));
    }

    expense.status = status;
    expense.notes = notes || expense.notes;
    expense.approvedBy = req.user._id;
    expense.approvalDate = new Date();

    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error('Error processing expense:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error processing expense'));
  }
};

// Get expense statistics
const getExpenseStats = async (req, res, next) => {
  try {
    const stats = await Expense.aggregate([
      {
        $match: {
          status: 'Approved',
          ...(req.user.role !== 'admin' && req.user.role !== 'manager' 
              ? { submittedBy: req.user._id } 
              : {})
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error getting expense stats:', error);
    next(new ApiError(error.statusCode || 500, error.message || 'Error getting expense statistics'));
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  processExpense,
  getExpenseStats,
  getNextExpenseNumber
}; 