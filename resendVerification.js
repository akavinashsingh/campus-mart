// Utility script to resend verification email or manually verify a user
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const User = require("./models/User");
const nodemailer = require("nodemailer");

const dbUrl = process.env.ATLASDB_URL;

async function resendVerification(email) {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found with email:", email);
            process.exit(1);
        }

        if (user.isVerified) {
            console.log("User is already verified!");
            process.exit(0);
        }

        const verifyUrl = `https://www.campusmart.me/verify?token=${user.verificationToken}`;
        console.log("\n✓ Verification link for", email);
        console.log(verifyUrl);
        console.log("\nToken expires:", new Date(user.verificationTokenExpires));

        // Try to send email
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
        if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT),
                secure: SMTP_SECURE === "true",
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });

            const mailOptions = {
                from: process.env.SMTP_FROM || "no-reply@campus-mart",
                to: email,
                subject: "Verify your Campus Marketplace account",
                html: `<p>Hi ${user.fullName},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p><hr><p style="color: #666; font-size: 12px;"><strong>Need help?</strong> Contact us at <a href="mailto:23uj1a0504@mrem.ac.in">23uj1a0504@mrem.ac.in</a></p>`,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log("\n✓ Verification email sent successfully!");
            } catch (err) {
                console.error("\n✗ Email send failed:", err.message);
                console.log("Use the verification link above manually.");
            }
        } else {
            console.log("\n⚠ SMTP not configured. Use the verification link above manually.");
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

async function manualVerify(email) {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found with email:", email);
            process.exit(1);
        }

        if (user.isVerified) {
            console.log("User is already verified!");
            process.exit(0);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        console.log(`✓ User ${email} has been manually verified!`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

// Get command line arguments
const command = process.argv[2];
const email = process.argv[3];

if (!command || !email) {
    console.log("\nUsage:");
    console.log("  node resendVerification.js resend <email>    - Resend verification email");
    console.log("  node resendVerification.js verify <email>    - Manually verify user");
    console.log("\nExample:");
    console.log("  node resendVerification.js resend 23uj1a6219@mrem.ac.in");
    console.log("  node resendVerification.js verify 23uj1a6219@mrem.ac.in");
    process.exit(1);
}

if (command === "resend") {
    resendVerification(email);
} else if (command === "verify") {
    manualVerify(email);
} else {
    console.error("Invalid command. Use 'resend' or 'verify'");
    process.exit(1);
}
