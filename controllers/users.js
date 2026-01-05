const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        const { username, email, password, college, phone } = req.body;
        
        if (!username || !email || !password || !college || !phone) {
            req.flash("error", "All fields are required");
            return res.redirect("/signup");
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h

        const newUser = new User({
            email,
            username,
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
    const testAccounts = ['seller_john', 'buyer_sarah'];
    if (testAccounts.includes(req.user.username) && !req.user.isVerified) {
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
    req.flash("success", `Welcome back, ${req.user.username}!`);
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
    const user = await User.findById(req.user._id);
    res.render("users/profile.ejs", { user });
};

module.exports.getMyProducts = async (req, res) => {
    const Product = require("../models/Product");
    const products = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
};

module.exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { ...req.body.user });
    
    if (req.file) {
        user.profileImage = {
            url: req.file.path,
            filename: req.file.filename
        };
        await user.save();
    }
    
    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
};

module.exports.verifyEmail = async (req, res) => {
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