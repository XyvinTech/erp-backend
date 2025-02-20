require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createManager = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xyvin-erp';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Sample manager data
    const managerData = {
      username: 'manager',
      email: 'manager@xyvin.com',
      password: 'manager123',  // This will be hashed by the User model
      role: 'manager',
      isActive: true
    };

    // Check if manager already exists
    const existingManager = await User.findOne({ email: managerData.email });
    if (existingManager) {
      console.log('Manager user already exists');
      process.exit(0);
    }

    // Create the manager user
    const manager = await User.create(managerData);
    
    console.log('Manager user created successfully:', {
      id: manager._id,
      username: manager.username,
      email: manager.email,
      role: manager.role,
      isActive: manager.isActive
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createManager(); 