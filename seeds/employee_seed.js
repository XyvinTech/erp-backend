
const Employee = require('../src/modules/hrm/models/Employee');

const seedEmployees = async () => {
    try {
        
        const existingEmployees = await Employee.find();
        if (existingEmployees.length > 0) {
            console.log('Employees already seeded');
            return;
        }
        
        
        const employees = [
            {
                firstName: 'Tijo', 
                lastName: 'Thomas',
                department: 'IT',
                position: 'Software Engineer',
                joiningDate: new Date(),
                salary: 100000,
                employeeId: '123456',
                email: 'ttj@duck.com',
                password: '123456',
                role: 'super_admin',
                isActive: true,
            }
        ]

        await Employee.insertMany(employees);
        console.log('Employees seeded successfully');
    } catch (error) {
        console.error('Error seeding employees:', error);
        process.exit(1);
    }
}

module.exports = seedEmployees;

