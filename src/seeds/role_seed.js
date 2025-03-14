const Role = require('../modules/role/role.model');

const seedRoles = async () => {
    try {
        const existingRoles = await Role.find();
        if (existingRoles.length > 0) {
            console.log('Roles already seeded');
            return;
        }

        const roles = [
            {
                name: 'ERP System Administrator',
                description: 'Full access to all ERP system features and administration',
            },
            {
                name: 'IT Manager',
                description: 'Manages IT infrastructure and technical resources',
            },
            {
                name: 'Project Manager',
                description: 'Oversees project planning, execution, and delivery',
            },
            {
                name: 'Business Analyst',
                description: 'Analyzes business processes and requirements',
            },
            {
                name: 'Developer',
                description: 'Develops and maintains software applications',
            },
            {
                name: 'Quality Assurance Specialist',
                description: 'Ensures software quality through testing and validation',
            },
            {
                name: 'HR Manager',
                description: 'Manages human resources and personnel matters',
            },
            {
                name: 'Finance Manager',
                description: 'Oversees financial operations and reporting',
            },
            {
                name: 'Sales Manager',
                description: 'Manages sales operations and customer relationships',
            },
            {
                name: 'Employee',
                description: 'Regular employee with basic access rights',
            }
        ];

        await Role.insertMany(roles);
        console.log('Roles seeded successfully');
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
}

module.exports = seedRoles;
