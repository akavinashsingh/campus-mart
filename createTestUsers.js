require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testUsers = [
    {
        fullName: 'John Seller',
        email: 'seller.john@college.edu',
        password: 'TestPass123!',
        phone: '9876543210',
        college: 'MIT'
    },
    {
        fullName: 'Sarah Buyer',
        email: 'buyer.sarah@college.edu',
        password: 'TestPass456!',
        phone: '9876543211',
        college: 'Stanford'
    }
];

async function createTestUsers() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✓ Connected to database');

        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            
            if (existingUser) {
                console.log(`⚠ User already exists: ${userData.email}`);
                // Update to verified status
                existingUser.isVerified = true;
                existingUser.verificationToken = undefined;
                existingUser.verificationTokenExpires = undefined;
                await existingUser.save();
                console.log(`  ✓ Updated ${userData.email} to verified status`);
            } else {
                // Create new user
                const newUser = new User({
                    email: userData.email,
                    fullName: userData.fullName,
                    college: userData.college,
                    phone: userData.phone,
                    isVerified: true, // Pre-verified for testing
                    verificationToken: undefined,
                    verificationTokenExpires: undefined
                });
                
                await User.register(newUser, userData.password);
                console.log(`✓ Created test user: ${userData.email}`);
                console.log(`  Name: ${userData.fullName}`);
                console.log(`  Password: ${userData.password}`);
            }
        }

        console.log('\n✓ All test users ready!');
        console.log('\nYou can now login with:');
        console.log('- Email: seller.john@college.edu | Password: TestPass123!');
        console.log('- Email: buyer.sarah@college.edu | Password: TestPass456!');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

createTestUsers();
