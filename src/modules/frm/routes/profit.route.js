const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const profitController = require('../controllers/profit.controller');
// Assuming you'll create a validation file, we'll reference it
const profitValidation = require('../validations/profit.validation');

const router = express.Router();

// Main profit routes
router
  .route('/')
  .post(
    auth(),
    validate(profitValidation.createProfit),
    profitController.createProfit
  )
  .get(
    auth(),
    validate(profitValidation.getProfits),
    profitController.getProfits
  );

// Stats route
router
  .route('/stats')
  .get(
    auth(),
    validate(profitValidation.getProfitStats),
    profitController.getProfitStats
  );

// Individual profit record routes
router
  .route('/:profitId')
  .get(
    auth(),
    validate(profitValidation.getProfitById),
    profitController.getProfitById
  )
  .patch(
    auth(),
    validate(profitValidation.updateProfit),
    profitController.updateProfit
  )
  .delete(
    auth(),
    validate(profitValidation.deleteProfit),
    profitController.deleteProfit
  );

// Verify profit route
router
  .route('/:profitId/verify')
  .post(
    auth(),
    validate(profitValidation.verifyProfit),
    profitController.verifyProfit
  );

module.exports = router;