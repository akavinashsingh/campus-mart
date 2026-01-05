// Script to delete test users from database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function deleteTestUser() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('Connected to MongoDB');

        // Delete the test user
        const result = await User.deleteOne({ username: 'seller_john' });
        
        if (result.deletedCount > 0) {
            console.log('✅ Successfully deleted seller_john user');
        } else {
            console.log('ℹ️ No user found with username seller_john');
        }

        // Delete buyer_sarah as well
        const result2 = await User.deleteOne({ username: 'buyer_sarah' });
        
        if (result2.deletedCount > 0) {
            console.log('✅ Successfully deleted buyer_sarah user');
        } else {
            console.log('ℹ️ No user found with username buyer_sarah');
        }

        console.log('\n✅ Cleanup complete! You can now signup the test users again.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

deleteTestUser();
