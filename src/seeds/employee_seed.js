const Employee = require('../modules/hrm/employee/employee.model');
const bcrypt = require('bcryptjs');
const Role = require('../modules/role/role.model');
const mongoose = require('mongoose');

const seedEmployees = async () => {
    try {
        console.log('Starting employee seed...');
        
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check specifically for the admin employee
        const existingAdminEmployee = await Employee.findOne({ 
            email: 'ttj@duck.com',
            employeeId: '123456'
        });
        
        if (existingAdminEmployee) {
            console.log('Admin employee already exists');
            return;
        }

        // Find admin role with detailed logging
        console.log('Searching for admin role...');
        const adminRole = await Role.findOne({ name: 'ERP System Administrator' });
        console.log('Admin role search result:', adminRole);
        
        if (!adminRole) {
            throw new Error('Admin role not found. Please run role seeds first.');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('123456', 10);
        console.log('Password hashed successfully');

        const employeeData = {
            firstName: 'Tijo', 
            lastName: 'Thomas',
            department: '67b5d1084fdab849259fe4c4',
            position: '67b5d5a00d436d70bff73433',
            joiningDate: new Date(),
            salary: 100000,
            employeeId: '123456',
            email: 'ttj@duck.com',
            password: hashedPassword,
            role: adminRole._id,
            phone: '1234567890',
            isActive: true,
        };

        console.log('Attempting to create admin employee...');

        // Try creating a single employee
        const newEmployee = new Employee(employeeData);
        const validationError = newEmployee.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            throw validationError;
        }

        const savedEmployee = await newEmployee.save();
        console.log('Admin employee created successfully');

        console.log('Employee seed completed');
    } catch (error) {
        console.error('Detailed error in employee seed:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
        throw error;
    }
}

module.exports = seedEmployees;

