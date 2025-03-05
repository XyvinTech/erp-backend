const express = require('express');
const router = express.Router();
const profitController = require('../controllers/profit.controller');

// Get next profit number
router.get('/next-number', profitController.getNextProfitNumber);

// Create a new profit
router.post('/', profitController.createProfit);

// Get all profits
router.get('/', profitController.getProfits);

// Get profit by ID
router.get('/:id', profitController.getProfitById);

// Update profit
router.put('/:id', profitController.updateProfit);

// Delete profit
router.delete('/:id', profitController.deleteProfit);

module.exports = router;