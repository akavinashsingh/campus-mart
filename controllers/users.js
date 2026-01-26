const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Generate a unique color for user avatar
const generateProfileColor = () => {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
        '#F5B041', '#D7BDE2', '#82E0AA', '#F5B7B1', '#85C1E2',
        '#F9E79F', '#D5F4E6', '#FADBD8', '#D5F4E6', '#A9DFBF'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, college, phone } = req.body;
        
        if (!fullName || !email || !password || !college || !phone) {
            req.flash("error", "All fields are required");
            return res.redirect("/signup");
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h

        const newUser = new User({
            email,
            fullName,
            college,
            phone,
            verificationToken,
            verificationTokenExpires,
            isVerified: false,
            profileColor: generateProfileColor(),
        });
        await User.register(newUser, password);
        console.log("✓ User registered successfully:", email);

        // Send email asynchronously (don't wait for it)
        console.log("→ Attempting to send verification email to:", email);
        sendVerificationEmail(req, email, verificationToken).catch(err => {
            console.error("✗ Email send error:", err.message);
            console.error("✗ Full error:", err);
        });

        req.flash("success", "Account created! Check your inbox (and spam) for the verification email before logging in.");
        res.redirect("/login");
    } catch (e) {
        console.error("Signup error:", e);
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    // Auto-verify test accounts for development/testing
    const testAccounts = ['seller.john@college.edu', 'buyer.sarah@college.edu'];
    if (testAccounts.includes(req.user.email) && !req.user.isVerified) {
        req.user.isVerified = true;
        req.user.verificationToken = undefined;
        req.user.verificationTokenExpires = undefined;
        await req.user.save();
    }
    
    if (!req.user.isVerified) {
        req.logout(() => {});
        req.flash("error", "Please verify your email before logging in.");
        return res.redirect("/login");
    }
    req.flash("success", `Welcome ${req.user.fullName} to CampusMart!`);
    const redirectUrl = res.locals.redirectUrl || "/products";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You have been logged out!");
        res.redirect("/products");
    });
};

module.exports.renderProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/products");
        }
        
        res.render("users/profile.ejs", { user });
    } catch (err) {
        console.error("Error loading profile:", err);
        req.flash("error", "Error loading profile");
        res.redirect("/products");
    }
};

module.exports.viewUserProfile = async (req, res) => {
    try {
        const Product = require("../models/Product");
        const user = await User.findById(req.params.id);
        
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/products");
        }
        
        // Get user's products
        const products = await Product.find({ owner: user._id }).sort({ createdAt: -1 });
        
        res.render("users/public-profile.ejs", { profileUser: user, products });
    } catch (err) {
        console.error("Error loading user profile:", err);
        req.flash("error", "Error loading profile");
        res.redirect("/products");
    }
};

module.exports.saveProduct = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.id;
        
        if (!user.savedItems.includes(productId)) {
            user.savedItems.push(productId);
            await user.save();
        }
        
        res.json({ success: true, saved: true });
    } catch (err) {
        console.error("Error saving product:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports.unsaveProduct = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.id;
        
        user.savedItems = user.savedItems.filter(id => !id.equals(productId));
        await user.save();
        
        res.json({ success: true, saved: false });
    } catch (err) {
        console.error("Error unsaving product:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports.getSavedItems = async (req, res) => {
    try {
        const Product = require("../models/Product");
        const user = await User.findById(req.user._id).populate('savedItems');
        res.render("users/saved-items.ejs", { savedItems: user.savedItems });
    } catch (err) {
        console.error("Error loading saved items:", err);
        req.flash("error", "Error loading saved items");
        res.redirect("/products");
    }
};

module.exports.getMyProducts = async (req, res) => {
    try {
        const Product = require("../models/Product");
        const products = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Error fetching products" });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id !== req.user._id.toString()) {
            req.flash("error", "Unauthorized");
            return res.redirect("/profile");
        }
        
        const user = await User.findByIdAndUpdate(id, { ...req.body.user });
        
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/products");
        }
        
        if (req.file) {
            user.profileImage = {
                url: req.file.path,
                filename: req.file.filename
            };
            await user.save();
        }
        
        req.flash("success", "Profile updated successfully!");
        res.redirect("/profile");
    } catch (err) {
        console.error("Error updating profile:", err);
        req.flash("error", "Error updating profile");
        res.redirect("/profile");
    }
};

module.exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            req.flash("error", "Invalid verification link");
            return res.redirect("/login");
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            req.flash("error", "Verification link is invalid or has expired.");
            return res.redirect("/login");
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        req.flash("success", "Email verified! Welcome to CampusMart. You can now log in.");
        res.redirect("/login");
    } catch (err) {
        console.error("Error verifying email:", err);
        req.flash("error", "Error verifying email");
        res.redirect("/login");
    }
};

module.exports.renderForgotPasswordForm = (req, res) => {
    res.render("users/forgot-password.ejs");
};

module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            req.flash("error", "Please provide an email address");
            return res.redirect("/forgot-password");
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if email exists or not for security
            req.flash("success", "If an account with that email exists, you will receive a password reset link.");
            return res.redirect("/login");
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = resetToken;
        user.passwordResetTokenExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
        await user.save();

        // Send password reset email
        await sendPasswordResetEmail(req, email, resetToken);

        req.flash("success", "Password reset link has been sent to your email. It expires in 1 hour.");
        res.redirect("/login");
    } catch (err) {
        console.error("Forgot password error:", err);
        req.flash("error", "Error processing password reset request");
        res.redirect("/forgot-password");
    }
};

module.exports.renderResetPasswordForm = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            req.flash("error", "Invalid reset link");
            return res.redirect("/login");
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            req.flash("error", "Password reset link is invalid or has expired.");
            return res.redirect("/login");
        }

        res.render("users/reset-password.ejs", { token });
    } catch (err) {
        console.error("Error rendering reset form:", err);
        req.flash("error", "Error loading password reset form");
        res.redirect("/login");
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            req.flash("error", "All fields are required");
            return res.redirect(`/reset-password?token=${token}`);
        }

        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect(`/reset-password?token=${token}`);
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            req.flash("error", "Password reset link is invalid or has expired.");
            return res.redirect("/login");
        }

        // Set new password using passport-local-mongoose
        await user.setPassword(password);
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save();

        req.flash("success", "Your password has been reset successfully. Please log in with your new password.");
        res.redirect("/login");
    } catch (err) {
        console.error("Reset password error:", err);
        req.flash("error", "Error resetting password");
        res.redirect("/login");
    }
};

async function sendVerificationEmail(req, toEmail, token) {
    console.log("\n=== Sending Verification Email ===");
    console.log("To:", toEmail);
    console.log("Token:", token.substring(0, 20) + "...");
    
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;
    
    console.log("\n📧 Verification link:", verifyUrl);

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    let transporter;

    console.log("SMTP Config Check:", {
        host: SMTP_HOST ? "✓" : "✗",
        port: SMTP_PORT ? "✓" : "✗",
        user: SMTP_USER ? "✓" : "✗",
        pass: SMTP_PASS ? "✓" : "✗"
    });

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        console.log("→ Creating email transporter...");
        
        // Use port 465 with SSL for better compatibility with cloud hosting
        const port = Number(SMTP_PORT);
        const secure = port === 465 ? true : (SMTP_SECURE === "true");
        
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: port,
            secure: secure,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 5000,    // 5 seconds
            socketTimeout: 15000,     // 15 seconds
            pool: true,               // Use connection pooling
            maxConnections: 1,        // Limit concurrent connections
            rateDelta: 20000,         // Minimum time between sends
            rateLimit: 5              // Max emails per rateDelta
        });
        
        console.log(`→ Transporter config: ${SMTP_HOST}:${port} (secure: ${secure})`);
    } else {
        console.error("✗ SMTP configuration incomplete!");
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || "no-reply@campus-mart",
        to: toEmail,
        subject: "Verify your CampusMart account",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f7f9fb; border: 1px solid #e5e7eb; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; font-weight: 700; color: #4b5563;">CampusMart</div>
                    <div style="color: #6b7280; font-size: 14px;">Verify your email to start buying & selling</div>
                </div>

                <p style="color: #374151; font-size: 15px; margin: 16px 0 8px;">Hi there,</p>
                <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Tap the button below to verify your email and activate your CampusMart account.</p>

                <div style="text-align: center; margin: 20px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">Verify email</a>
                </div>

                <p style="color: #6b7280; font-size: 12px; margin: 0 0 14px;">Link expires in 24 hours. If the button doesn't work, copy and paste this link:</p>
                <p style="color: #2563eb; font-size: 12px; word-break: break-all; margin: 0 0 16px;">${verifyUrl}</p>

                <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">If you didn’t create this account, you can ignore this email.</p>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 16px;">Need help? Contact us at <a href="mailto:23uj1a0504@mrem.ac.in" style="color: #2563eb; text-decoration: none;">23uj1a0504@mrem.ac.in</a></p>

                <div style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 12px;">© 2026 CampusMart</div>
            </div>
        `,
    };

    if (transporter) {
        try {
            console.log("→ Sending email...");
            
            // Wrap in Promise with timeout
            const sendWithTimeout = new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Email send timeout after 20 seconds'));
                }, 20000);
                
                try {
                    const info = await transporter.sendMail(mailOptions);
                    clearTimeout(timeout);
                    resolve(info);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
            
            const info = await sendWithTimeout;
            console.log("✓ Email sent successfully to:", toEmail);
            console.log("✓ Message ID:", info.messageId);
            console.log("===========================\n");
        } catch (err) {
            console.error("\n✗ Email send failed:", err.message);
            console.error("✗ Error code:", err.code);
            
            // Specific error messages for common issues
            if (err.message.includes('timeout')) {
                console.error("✗ TIMEOUT: SMTP server not responding. Possible causes:");
                console.error("  - Render may be blocking SMTP port 587");
                console.error("  - Try using port 465 instead (set SMTP_PORT=465)");
                console.error("  - Or use SendGrid/Mailgun for cloud hosting");
            } else if (err.code === 'EAUTH') {
                console.error("✗ AUTH FAILED: Gmail credentials rejected");
                console.error("  - Verify SMTP_USER and SMTP_PASS in Render env vars");
                console.error("  - Generate new App Password at: https://myaccount.google.com/apppasswords");
            } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
                console.error("✗ CONNECTION FAILED: Cannot reach Gmail SMTP");
                console.error("  - Render free tier may block SMTP ports");
                console.error("  - Recommended: Use SendGrid or Mailgun instead");
            }
            
            console.error("✗ Full error:", err);
            console.log("⚠ Fallback: Use verification link above to verify email");
            console.log("===========================\n");
            // Don't throw - allow signup to complete even if email fails
        }
    } else {
        console.error("✗ No transporter configured - email not sent!");
        console.log("⚠ Use verification link above manually");
        console.log("===========================\n");
    }
}

async function sendPasswordResetEmail(req, toEmail, token) {
    console.log("\n=== Sending Password Reset Email ===");
    console.log("To:", toEmail);
    console.log("Token:", token.substring(0, 20) + "...");
    
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    console.log("\n🔗 Password reset link:", resetUrl);

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    let transporter;

    console.log("SMTP Config Check:", {
        host: SMTP_HOST ? "✓" : "✗",
        port: SMTP_PORT ? "✓" : "✗",
        user: SMTP_USER ? "✓" : "✗",
        pass: SMTP_PASS ? "✓" : "✗"
    });

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        console.log("→ Creating email transporter...");
        
        // Use port 2525 for SendGrid cloud compatibility
        const port = Number(SMTP_PORT);
        const secure = port === 465 ? true : (SMTP_SECURE === "true");
        
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: port,
            secure: secure,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 15000,
            pool: true,
            maxConnections: 1,
            rateDelta: 20000,
            rateLimit: 5
        });
        
        console.log(`→ Transporter config: ${SMTP_HOST}:${port} (secure: ${secure})`);
    } else {
        console.error("✗ SMTP configuration incomplete!");
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || "no-reply@campus-mart",
        to: toEmail,
        subject: "Reset your CampusMart password",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f7f9fb; border: 1px solid #e5e7eb; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; font-weight: 700; color: #4b5563;">CampusMart</div>
                    <div style="color: #6b7280; font-size: 14px;">Reset your password</div>
                </div>

                <p style="color: #374151; font-size: 15px; margin: 16px 0 8px;">Hi there,</p>
                <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Click the button below to reset your password. This link expires in 1 hour.</p>

                <div style="text-align: center; margin: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">Reset password</a>
                </div>

                <p style="color: #6b7280; font-size: 12px; margin: 0 0 14px;">If the button doesn't work, copy and paste this link:</p>
                <p style="color: #2563eb; font-size: 12px; word-break: break-all; margin: 0 0 16px;">${resetUrl}</p>

                <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">If you didn't request a password reset, you can ignore this email.</p>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 16px;">Need help? Contact us at <a href="mailto:23uj1a0504@mrem.ac.in" style="color: #2563eb; text-decoration: none;">23uj1a0504@mrem.ac.in</a></p>

                <div style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 12px;">© 2026 CampusMart</div>
            </div>
        `,
    };

    if (transporter) {
        try {
            console.log("→ Sending email...");
            
            // Wrap in Promise with timeout
            const sendWithTimeout = new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Email send timeout after 20 seconds'));
                }, 20000);
                
                try {
                    const info = await transporter.sendMail(mailOptions);
                    clearTimeout(timeout);
                    resolve(info);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
            
            const info = await sendWithTimeout;
            console.log("✓ Email sent successfully to:", toEmail);
            console.log("✓ Message ID:", info.messageId);
            console.log("===========================\n");
        } catch (err) {
            console.error("\n✗ Email send failed:", err.message);
            console.error("✗ Error code:", err.code);
            
            if (err.message.includes('timeout')) {
                console.error("✗ TIMEOUT: SMTP server not responding");
                console.error("  - Check SMTP_PORT setting (should be 2525 for SendGrid)");
            } else if (err.code === 'EAUTH') {
                console.error("✗ AUTH FAILED: Check SMTP credentials");
            } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
                console.error("✗ CONNECTION FAILED: Cannot reach email server");
            }
            
            console.error("✗ Full error:", err);
            console.log("⚠ Fallback: Use password reset link above to reset password");
            console.log("===========================\n");
        }
    } else {
        console.error("✗ No transporter configured - email not sent!");
        console.log("⚠ Use password reset link above manually");
        console.log("===========================\n");
    }
}