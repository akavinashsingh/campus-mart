require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');

async function syncCommentCounts() {
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✓ Connected to database');

        // Get all users
        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            // Get all products owned by this user
            const userProducts = await Product.find({ owner: user._id });
            
            // Count all reviews across all their products
            let totalComments = 0;
            for (const product of userProducts) {
                const reviews = await Review.find({ product: product._id });
                totalComments += reviews.length;
            }

            // Update user's totalComments
            user.totalComments = totalComments;
            await user.save();

            console.log(`✓ ${user.fullName}: ${totalComments} comments`);
        }

        console.log('\n✓ All comment counts synchronized!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

syncCommentCounts();
