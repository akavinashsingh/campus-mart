const mongoose = require("mongoose");
const User = require("./models/User");

// List of colors for user avatars
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
    '#F5B041', '#D7BDE2', '#82E0AA', '#F5B7B1', '#85C1E2',
    '#F9E79F', '#D5F4E6', '#FADBD8', '#D5F4E6', '#A9DFBF'
];

// Generate a random color..
const generateProfileColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
};

// Connect to MongoDB and assign colors to users without profileColor
const assignColors = async () => {
    try {
        // Load environment variables
        if (process.env.NODE_ENV !== "production") {
            require('dotenv').config();
        }

        // Connect to MongoDB
        const dbUrl = process.env.ATLASDB_URL;
        if (!dbUrl) {
            console.error("ERROR: ATLASDB_URL environment variable is not set!");
            process.exit(1);
        }
        
        await mongoose.connect(dbUrl);
        console.log("✓ Connected to MongoDB");

        // Find users without profileColor
        const usersWithoutColor = await User.find({ 
            $or: [
                { profileColor: null },
                { profileColor: undefined },
                { profileColor: { $exists: false } }
            ]
        });

        console.log(`Found ${usersWithoutColor.length} users without profile color`);

        if (usersWithoutColor.length === 0) {
            console.log("✓ All users already have profile colors!");
            await mongoose.connection.close();
            return;
        }

        // Update each user with a random color
        for (const user of usersWithoutColor) {
            user.profileColor = generateProfileColor();
            await user.save();
            console.log(`✓ Assigned color ${user.profileColor} to ${user.fullName} (${user.email})`);
        }

        console.log(`\n✓ Successfully assigned colors to ${usersWithoutColor.length} users`);
        await mongoose.connection.close();
        console.log("✓ Database connection closed");
    } catch (err) {
        console.error("✗ Error:", err.message);
        process.exit(1);
    }
};

assignColors();
