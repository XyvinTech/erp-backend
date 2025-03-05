const mongoose = require('mongoose');

const profitSchema = new mongoose.Schema({
  profitNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    required: true,
    enum: ['sales', 'services', 'investments', 'other']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: {
    type: Date
  },
  documents: [{
    fileName: {
      type: String,
      // required: true
    },
    fileUrl: {
      type: String,
      // required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
profitSchema.index({ status: 1, recordedBy: 1 });
profitSchema.index({ date: -1 });
profitSchema.index({ category: 1 });
profitSchema.index({ profitNumber: 1 }, { unique: true });

const Profit = mongoose.model('Profit', profitSchema);

module.exports = Profit; 