
const seedRoles = require('./role_seed');
const seedEmployees = require('./employee_seed');


async function runSeeds() {
    try {
        await seedRoles();
        await seedEmployees();
        console.log('All seeds executed successfully');
    } catch (error) {
        console.error('Error seeding roles:', error);
       
    }
}

module.exports = runSeeds;
