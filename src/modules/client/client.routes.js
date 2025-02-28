const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient
} = require('./client.controller');

router.post('/', auth, createClient);
router.get('/', auth, getClients);
router.get('/:id', auth, getClient);
router.put('/:id', auth, updateClient);
router.delete('/:id', auth, deleteClient);

module.exports = router; 