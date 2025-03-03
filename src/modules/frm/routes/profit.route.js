const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const profitValidation = require('../validations/profit.validation');
const profitController = require('../controllers/profit.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(profitValidation.createProfit), profitController.createProfit)
  .get(auth(), validate(profitValidation.getProfits), profitController.getProfits);

router
  .route('/stats')
  .get(auth(), profitController.getProfitStats);

router
  .route('/:profitId')
  .get(auth(), validate(profitValidation.getProfit), profitController.getProfit)
  .patch(auth(), validate(profitValidation.updateProfit), profitController.updateProfit)
  .delete(auth(), validate(profitValidation.deleteProfit), profitController.deleteProfit);

module.exports = router; 