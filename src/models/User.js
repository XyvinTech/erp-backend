const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'manager'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Static method to create test user
userSchema.statics.createTestUser = async function() {
    try {
        const testUser = {
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin'
        };

        const exists = await this.findOne({ email: testUser.email });
        if (!exists) {
            await this.create(testUser);
            console.log('Test user created successfully');
        } else {
            console.log('Test user already exists');
        }
    } catch (error) {
        console.error('Error creating test user:', error.message);
    }
};

// Check if model exists before compiling
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User; 