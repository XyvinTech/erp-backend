const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, {
  timestamps: true
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-remove middleware to clean up tasks
employeeSchema.pre('remove', async function(next) {
  if (this.tasks && this.tasks.length > 0) {
    const Task = mongoose.model('Task');
    await Task.updateMany(
      { _id: { $in: this.tasks } },
      { $unset: { assignee: 1 } }
    );
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee; 