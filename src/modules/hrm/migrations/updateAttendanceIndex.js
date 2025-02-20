const mongoose = require('mongoose');
require('dotenv').config();

const updateAttendanceIndexes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the attendance collection
        const collection = mongoose.connection.collection('attendances');

        // Drop all existing indexes except _id
        console.log('Dropping all existing indexes...');
        await collection.dropIndexes();
        console.log('All indexes dropped successfully');

        // Create new non-unique compound index
        console.log('Creating new index...');
        await collection.createIndex(
            { 
                employee: 1, 
                date: 1, 
                createdAt: -1 
            },
            { 
                unique: false,
                background: true,
                name: 'attendance_query_index'
            }
        );
        console.log('New index created successfully');

        // Verify indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updateAttendanceIndexes(); 