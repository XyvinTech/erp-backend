require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const activateUser = async (userId) => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xyvin-erp';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Use updateOne to bypass validation
    const result = await User.updateOne(
      { _id: userId },
      { $set: { isActive: true } }
    );
    
    if (result.matchedCount === 0) {
      console.error('User not found');
      process.exit(1);
    }

    if (result.modifiedCount === 1) {
      // Fetch the updated user to show details
      const user = await User.findById(userId);
      console.log('User details:', {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
      console.log('User account activated successfully');
    } else {
      console.log('User was already active');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID');
  process.exit(1);
}

activateUser(userId); 