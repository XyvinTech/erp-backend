const seedRoles = require('./role_seed');
const seedEmployees = require('./employee_seed');

async function runSeeds() {
    try {
        // Clear order of seeding - roles must come first
        console.log('Starting seeds...');
        
        console.log('Seeding roles...');
        await seedRoles();
        
        console.log('Seeding employees...');
        await seedEmployees();

        console.log('All seeds executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
}

// Execute immediately if this is the main module
if (require.main === module) {
    runSeeds();
}

module.exports = runSeeds;


