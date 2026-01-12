// Script to delete test user accounts and ALL their associated data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');
const ContactLog = require('./models/ContactLog');

async function cleanupTestUsers() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✅ Connected to MongoDB\n');

        // Get email addresses from command line arguments
        const emails = process.argv.slice(2);

        if (emails.length === 0) {
            console.log('❌ No email addresses provided!\n');
            console.log('Usage: node cleanupTestData.js email1@example.com email2@example.com\n');
            console.log('Example: node cleanupTestData.js john@college.edu sarah@college.edu\n');
            process.exit(1);
        }

        console.log('🗑️  Starting cleanup for the following emails:');
        emails.forEach((email, index) => console.log(`   ${index + 1}. ${email}`));
        console.log('');

        let totalUsersDeleted = 0;
        let totalProductsDeleted = 0;
        let totalReviewsDeleted = 0;
        let totalContactLogsDeleted = 0;

        for (const email of emails) {
            console.log(`\n📧 Processing: ${email}`);
            console.log('─'.repeat(50));

            // Find the user
            const user = await User.findOne({ email });

            if (!user) {
                console.log(`   ⚠️  No user found with email: ${email}`);
                continue;
            }

            const userId = user._id;
            console.log(`   ✓ Found user: ${user.fullName} (${user.username || 'N/A'})`);

            // Delete all products owned by this user
            const productsResult = await Product.deleteMany({ owner: userId });
            console.log(`   ✓ Deleted ${productsResult.deletedCount} products`);
            totalProductsDeleted += productsResult.deletedCount;

            // Delete all reviews written by this user
            const reviewsResult = await Review.deleteMany({ reviewer: userId });
            console.log(`   ✓ Deleted ${reviewsResult.deletedCount} reviews by user`);
            totalReviewsDeleted += reviewsResult.deletedCount;

            // Delete all contact logs where user was buyer or seller
            const contactLogsResult = await ContactLog.deleteMany({
                $or: [{ buyer: userId }, { seller: userId }]
            });
            console.log(`   ✓ Deleted ${contactLogsResult.deletedCount} contact logs`);
            totalContactLogsDeleted += contactLogsResult.deletedCount;

            // Finally, delete the user account
            await User.deleteOne({ _id: userId });
            console.log(`   ✓ Deleted user account: ${email}`);
            totalUsersDeleted++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('🎉 CLEANUP COMPLETE!');
        console.log('='.repeat(50));
        console.log(`✅ Users deleted:        ${totalUsersDeleted}`);
        console.log(`✅ Products deleted:     ${totalProductsDeleted}`);
        console.log(`✅ Reviews deleted:      ${totalReviewsDeleted}`);
        console.log(`✅ Contact logs deleted: ${totalContactLogsDeleted}`);
        console.log('='.repeat(50));
        console.log('\n💡 All test data has been removed from the database.\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error during cleanup:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

cleanupTestUsers();
