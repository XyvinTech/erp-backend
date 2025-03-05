const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../../middleware/auth');
const upload = require('../../../middleware/upload');
const {
  createOfficeLoan,
  getOfficeLoans,
  getOfficeLoanById,
  updateOfficeLoan,
  processLoanRequest,
  recordPayment,
  getLoanStats
} = require('../controllers/officeLoanController');

// Get loan statistics by department
router.get('/stats/department', 
  auth, 
  getLoanStats
);

// Create new office loan request
router.post('/', 
  auth, 
  upload.array('documents'), 
  createOfficeLoan
);

// Get all office loans (with filters)
router.get('/', 
  auth, 
  getOfficeLoans
);

// Get office loan by ID
router.get('/:id', 
  auth, 
  getOfficeLoanById
);

// Update office loan request
router.put('/:id', 
  auth, 
  upload.array('documents'), 
  updateOfficeLoan
);

// Process loan request (approve/reject)
router.post('/:id/process', 
  auth, 
  processLoanRequest
);

// Record loan payment
router.post('/:id/payment', 
  auth, 
  recordPayment
);

module.exports = router; 