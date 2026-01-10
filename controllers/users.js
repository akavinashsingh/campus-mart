const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
        });
        await User.register(newUser, password);

        // Send email asynchronously (don't wait for it)
        sendVerificationEmail(req, email, verificationToken).catch(err => {
            console.error("Email send error:", err.message);
        });

        req.flash("success", "Account created! Check your email to verify before logging in.");
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
    req.flash("success", `Welcome back, ${req.user.fullName}!`);
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

        req.flash("success", "Email verified! You can now log in.");
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
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    // Always log the verification link for fallback
    console.log("[Email verification link]", verifyUrl);

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    let transporter;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE === "true",
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || "no-reply@campus-mart",
        to: toEmail,
        subject: "Verify your Campus Marketplace account",
        html: `<p>Hi,</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    };

    if (transporter) {
        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully to:", toEmail);
        } catch (err) {
            console.error("Email send failed:", err.message);
            console.log("Fallback: Use verification link above to verify email");
        }
    }
}

async function sendPasswordResetEmail(req, toEmail, token) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Always log the reset link for fallback
    console.log("[Password reset link]", resetUrl);

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    let transporter;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE === "true",
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || "no-reply@campus-mart",
        to: toEmail,
        subject: "Reset your Campus Marketplace password",
        html: `<p>Hi,</p><p>You requested to reset your password. Click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p><p>If you did not request this, please ignore this email.</p>`,
    };

    if (transporter) {
        try {
            await transporter.sendMail(mailOptions);
            console.log("Password reset email sent successfully to:", toEmail);
        } catch (err) {
            console.error("Email send failed:", err.message);
            console.log("Fallback: Use reset link above to reset password");
        }
    }
}