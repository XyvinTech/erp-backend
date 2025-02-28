const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'on-hold', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  }],
  comments: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      name: String,
      url: String
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });

module.exports = mongoose.model('Task', taskSchema); 