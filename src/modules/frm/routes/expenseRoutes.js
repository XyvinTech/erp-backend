const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../../middleware/auth');
const upload = require('../../../middleware/upload');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  processExpense,
  getExpenseStats,
  getNextExpenseNumber
} = require('../controllers/expenseController');

// All routes require authentication
router.use(auth);

// Get next expense number
router.get('/next-number', getNextExpenseNumber);

// Get expense statistics
router.get('/stats', getExpenseStats);

// Get all expenses (with filters)
router.get('/', getExpenses);

// Create new expense
router.post('/', upload.array('documents'), createExpense);

// Get expense by ID
router.get('/:id', getExpenseById);

// Update expense
router.put('/:id', upload.array('documents'), updateExpense);

// Delete expense
router.delete('/:id', deleteExpense);

// Process expense (approve/reject) - requires admin or manager role
router.patch('/:id/process', checkRole(['admin', 'manager']), processExpense);

module.exports = router; 