const Department = require('../modules/hrm/department/department.model');
const mongoose = require('mongoose');

const seedDepartments = async () => {
    try {
        console.log('Starting department seed...');

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check if departments already exist
        const existingDepartments = await Department.countDocuments();
        if (existingDepartments > 0) {
            console.log(`${existingDepartments} departments already exist in the database`);
            return;
        }

        // Sample department data
        const departmentsData = [
            {
                name: 'Administration',
                code: 'ADMIN',
                description: 'Responsible for overall management and administration of the organization',
                location: 'Headquarters - Floor 5',
                budget: 500000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Human Resources',
                code: 'HR',
                description: 'Manages recruitment, employee relations, benefits, and organizational development',
                location: 'Headquarters - Floor 4',
                budget: 350000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Information Technology',
                code: 'IT',
                description: 'Manages IT infrastructure, software development, and technical support',
                location: 'Headquarters - Floor 3',
                budget: 750000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Finance',
                code: 'FIN',
                description: 'Manages financial planning, accounting, budgeting, and financial reporting',
                location: 'Headquarters - Floor 4',
                budget: 450000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Sales',
                code: 'SALES',
                description: 'Responsible for sales operations, customer acquisition, and revenue generation',
                location: 'Headquarters - Floor 2',
                budget: 650000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Marketing',
                code: 'MKT',
                description: 'Manages brand development, marketing campaigns, and market research',
                location: 'Headquarters - Floor 2',
                budget: 400000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Engineering',
                code: 'ENG',
                description: 'Responsible for product development, engineering, and technical innovation',
                location: 'Tech Campus - Building A',
                budget: 850000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Quality Assurance',
                code: 'QA',
                description: 'Ensures product quality, testing, and compliance with standards',
                location: 'Tech Campus - Building B',
                budget: 300000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Project Management',
                code: 'PM',
                description: 'Oversees project planning, execution, and delivery across the organization',
                location: 'Headquarters - Floor 3',
                budget: 400000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Customer Support',
                code: 'CS',
                description: 'Provides customer service, technical support, and issue resolution',
                location: 'Support Center - Downtown',
                budget: 350000,
                employeeCount: 0,
                isActive: true
            }
        ];

        console.log('Attempting to create departments...');

        // Insert all departments
        const createdDepartments = await Department.create(departmentsData);
        console.log(`Successfully created ${createdDepartments.length} departments`);

        console.log('Department seed completed');
    } catch (error) {
        console.error('Error seeding departments:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
        throw error;
    }
};

module.exports = seedDepartments; 