// Test SMTP email configuration
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const nodemailer = require("nodemailer");

async function testSMTP() {
    console.log("\n=== Testing SMTP Configuration ===\n");
    
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM } = process.env;
    
    console.log("SMTP Configuration:");
    console.log("  Host:", SMTP_HOST);
    console.log("  Port:", SMTP_PORT);
    console.log("  Secure:", SMTP_SECURE);
    console.log("  User:", SMTP_USER);
    console.log("  From:", SMTP_FROM);
    console.log("  Password:", SMTP_PASS ? "✓ Set (length: " + SMTP_PASS.length + ")" : "✗ Not set");
    console.log("");

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        console.error("✗ ERROR: Missing SMTP configuration!");
        console.error("  Please check your .env file");
        process.exit(1);
    }

    try {
        console.log("Creating transporter...");
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE === "true",
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            debug: true, // Enable debug output
            logger: true  // Log information to console
        });

        console.log("\nVerifying SMTP connection...");
        await transporter.verify();
        console.log("✓ SMTP connection successful!\n");

        // Send a test email
        const testEmail = SMTP_USER; // Send to yourself
        console.log(`Sending test email to ${testEmail}...`);
        
        const info = await transporter.sendMail({
            from: SMTP_FROM || SMTP_USER,
            to: testEmail,
            subject: "Test Email - Campus Mart Verification System",
            html: `
                <h2>Test Email Successful!</h2>
                <p>This is a test email from your Campus Mart application.</p>
                <p>If you received this, your email verification system is working correctly.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Sent at: ${new Date().toLocaleString()}<br>
                    From: Campus Mart Email System
                </p>
            `
        });

        console.log("✓ Test email sent successfully!");
        console.log("  Message ID:", info.messageId);
        console.log("  Response:", info.response);
        console.log("\n✓ Email system is working! Check your inbox at:", testEmail);
        
    } catch (error) {
        console.error("\n✗ SMTP Test Failed!");
        console.error("  Error:", error.message);
        
        if (error.code === 'EAUTH') {
            console.error("\n  → Authentication failed. Possible issues:");
            console.error("     1. Incorrect Gmail password or app password");
            console.error("     2. 2-Step Verification not enabled on Gmail");
            console.error("     3. App password expired or revoked");
            console.error("\n  → Solution: Generate a new App Password:");
            console.error("     1. Go to: https://myaccount.google.com/apppasswords");
            console.error("     2. Enable 2-Step Verification if not enabled");
            console.error("     3. Generate new app password for 'Mail'");
            console.error("     4. Update SMTP_PASS in .env file");
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
            console.error("\n  → Connection timeout. Possible issues:");
            console.error("     1. Firewall blocking port 587");
            console.error("     2. Network/ISP blocking SMTP");
            console.error("     3. Gmail temporarily blocking your IP");
        } else {
            console.error("\n  → Error details:", error);
        }
        
        process.exit(1);
    }
}

testSMTP();
