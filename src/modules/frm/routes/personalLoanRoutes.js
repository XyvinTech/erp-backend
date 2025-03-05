const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../../middleware/auth');
const upload = require('../../../middleware/upload');
const {
  createPersonalLoan,
  getPersonalLoans,
  getPersonalLoanById,
  updatePersonalLoan,
  processLoanApplication,
  recordPayment,
  getLoanStats,
  deletePersonalLoan
} = require('../controllers/personalLoanController');

// Create new personal loan application
router.post('/', 
  auth, 
  upload.array('documents'), 
  createPersonalLoan
);

// Get all personal loans (with filters)
router.get('/', 
  auth, 
  getPersonalLoans
);

// Get personal loan by ID
router.get('/:id', 
  auth, 
  getPersonalLoanById
);

// Update personal loan
router.put('/:id', 
  auth, 
  upload.array('documents'), 
  updatePersonalLoan
);

// Delete personal loan
router.delete('/:id',
  auth,
  deletePersonalLoan
);

// Process loan application (approve/reject)
router.post('/:id/process', 
  auth, 
  processLoanApplication
);

// Record loan payment
router.post('/:id/payment', 
  auth,  
  recordPayment
);

// Get loan statistics
router.get('/stats/overview', 
  auth,  
  getLoanStats
);

module.exports = router; 