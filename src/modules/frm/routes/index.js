const express = require('express');
const router = express.Router();
const expenseRoutes = require('./expenseRoutes');
const personalLoanRoutes = require('./personalLoanRoutes');
const officeLoanRoutes = require('./officeLoanRoutes');

// Mount routes
router.use('/expenses', expenseRoutes);
router.use('/personal-loans', personalLoanRoutes);
router.use('/office-loans', officeLoanRoutes);

module.exports = router; 