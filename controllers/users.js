const User = require("../models/User");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        const { username, email, password, college, phone } = req.body;
        const newUser = new User({ email, username, college, phone });
        
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", `Welcome to Campus Marketplace, ${username}!`);
            res.redirect("/products");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
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
    const user = await User.findById(req.user._id)
        .populate({
            path: 'products',
            model: 'Product'
        });
    res.render("users/profile.ejs", { user });
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