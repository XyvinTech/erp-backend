const seedRoles = require('./role_seed');
const seedEmployees = require('./employee_seed');



async function runSeeds() {

    try {
        await seedRoles();
        await seedEmployees();

        console.log('Seeds executed successfully');
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
}

module.exports = runSeeds;


