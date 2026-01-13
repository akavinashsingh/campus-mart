// Delete a user from the database
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const Review = require("./models/Review");

const dbUrl = process.env.ATLASDB_URL;

async function deleteUser(email) {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

        const user = await User.findOne({ email });
        if (!user) {
            console.error("❌ User not found with email:", email);
            process.exit(1);
        }

        console.log("\n📋 User found:");
        console.log("  ID:", user._id);
        console.log("  Name:", user.fullName);
        console.log("  Email:", user.email);
        console.log("  College:", user.college);
        console.log("  Phone:", user.phone);
        console.log("  Verified:", user.isVerified);

        // Delete user's products
        const products = await Product.find({ owner: user._id });
        console.log(`\n🗑️  Deleting ${products.length} product(s)...`);
        
        for (const product of products) {
            // Delete reviews for each product
            await Review.deleteMany({ product: product._id });
        }
        await Product.deleteMany({ owner: user._id });

        // Delete user's reviews
        const reviewCount = await Review.countDocuments({ author: user._id });
        console.log(`🗑️  Deleting ${reviewCount} review(s)...`);
        await Review.deleteMany({ author: user._id });

        // Delete the user
        await User.findByIdAndDelete(user._id);

        console.log("\n✅ User and all related data deleted successfully!");
        console.log(`   - User: ${email}`);
        console.log(`   - Products: ${products.length}`);
        console.log(`   - Reviews: ${reviewCount}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        console.error(err);
        process.exit(1);
    }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.log("\n❌ Usage: node deleteUser.js <email>");
    console.log("\nExample:");
    console.log("  node deleteUser.js 23uj1a0513@mrem.ac.in");
    process.exit(1);
}

console.log(`\n⚠️  WARNING: This will permanently delete the user and all their data!`);
console.log(`   Email: ${email}\n`);

deleteUser(email);
