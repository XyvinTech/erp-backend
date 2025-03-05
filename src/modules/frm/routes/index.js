const express = require('express');
const router = express.Router();
const expenseRoutes = require('./expenseRoutes');
const personalLoanRoutes = require('./personalLoanRoutes');
const officeLoanRoutes = require('./officeLoanRoutes');
const profitRoutes = require('./profit.route');

// Mount routes
router.use('/expenses', expenseRoutes);
router.use('/personal-loans', personalLoanRoutes);
router.use('/office-loans', officeLoanRoutes);
router.use('/profits', profitRoutes);

module.exports = router; 