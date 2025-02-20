require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../modules/hrm/models/Employee');
const Department = require('../modules/hrm/models/Department');
const Position = require('../modules/hrm/models/Position');
const User = require('../models/User');

const createManagerEmployee = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xyvin-erp';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin user for createdBy reference
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('Admin user not found. Please create an admin user first.');
      process.exit(1);
    }

    // First, let's ensure we have a department
    let department = await Department.findOne({ code: 'HR001' });
    if (!department) {
      department = await Department.create({
        name: 'Human Resources',
        code: 'HR001',
        description: 'Human Resources Department',
        location: 'Main Office',
        budget: 100000,
        isActive: true
      });
      console.log('Created department:', department.name);
    }

    // Create position with all required fields
    let position = await Position.findOne({ code: 'HR-MGR' });
    if (!position) {
      position = await Position.create({
        title: 'HR Manager',
        code: 'HR-MGR',
        description: 'Human Resources Manager Position',
        department: department._id,
        level: 3, // 1: Junior, 2: Mid, 3: Senior, 4: Lead, 5: Head
        salaryRange: {
          min: 50000,
          max: 100000
        },
        responsibilities: [
          'Team Management',
          'HR Operations',
          'Policy Development',
          'Employee Relations'
        ],
        requirements: [
          'MBA in HR',
          '5+ years experience',
          'Leadership skills'
        ],
        employmentType: 'Full-time',
        maxVacancies: 1,
        currentOccupancy: 0,
        employeeCount: 0,
        createdBy: adminUser._id,
        isActive: true
      });
      console.log('Created position:', position.title);
    }

    // Create the manager employee
    const managerData = {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@xyvin.com',
      password: 'manager123',
      phone: '+1234567890',
      department: department._id,
      position: position._id,
      joiningDate: new Date(),
      status: 'active',
      role: 'manager',
      salary: 75000,
      createdBy: adminUser._id,
      bankDetails: {
        accountName: 'John Manager',
        accountNumber: '1234567890',
        bankName: 'XYZ Bank',
        branchName: 'Main Branch',
        ifscCode: 'XYZ0001'
      },
      personalInfo: {
        dateOfBirth: new Date('1985-01-01'),
        gender: 'Male',
        maritalStatus: 'Married',
        bloodGroup: 'O+',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        }
      },
      emergencyContact: {
        name: 'Jane Manager',
        relationship: 'Spouse',
        phone: '+0987654321'
      },
      education: [{
        degree: 'MBA',
        institution: 'Business School',
        year: 2010,
        grade: 'A'
      }],
      workExperience: [{
        company: 'Previous Corp',
        position: 'Assistant Manager',
        startDate: new Date('2010-01-01'),
        endDate: new Date('2022-12-31'),
        responsibilities: ['Team Management', 'HR Operations', 'Recruitment']
      }],
      skills: ['Leadership', 'HR Management', 'Communication', 'Problem Solving'],
      isActive: true
    };

    // Check if manager already exists
    const existingManager = await Employee.findOne({ email: managerData.email });
    if (existingManager) {
      console.log('Manager already exists:', {
        id: existingManager._id,
        name: `${existingManager.firstName} ${existingManager.lastName}`,
        email: existingManager.email,
        role: existingManager.role
      });
      process.exit(0);
    }

    // Create the manager
    const manager = await Employee.create(managerData);
    
    // Update position counts
    await Position.findByIdAndUpdate(position._id, {
      $inc: { employeeCount: 1, currentOccupancy: 1 }
    });

    // Update department with the new manager
    department.manager = manager._id;
    await department.save();

    console.log('Manager created successfully:', {
      id: manager._id,
      name: `${manager.firstName} ${manager.lastName}`,
      email: manager.email,
      role: manager.role,
      department: department.name,
      position: position.title
    });

    console.log('Department updated with new manager');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createManagerEmployee(); 