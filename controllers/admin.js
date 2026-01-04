const User = require("../models/User");
const Product = require("../models/Product");
const Review = require("../models/Review");

module.exports.renderLoginForm = (req, res) => {
    res.render("admin/login.ejs");
};

module.exports.login = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        req.logout(err => {
            if (err) { return next(err); }
            req.flash("error", "Admin access required");
            return res.redirect("/admin/login");
        });
        return;
    }
    req.flash("success", "Welcome back, admin!");
    res.redirect("/admin");
};

module.exports.logout = (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        req.flash("success", "Logged out");
        res.redirect("/admin/login");
    });
};

module.exports.dashboard = async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isSold: false });
    res.render("admin/dashboard.ejs", { stats: { totalUsers, totalProducts, activeProducts } });
};

module.exports.listUsers = async (req, res) => {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.render("admin/users.ejs", { users });
};

module.exports.userDetail = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/admin/users");
    }
    const products = await Product.find({ owner: id }).sort({ createdAt: -1 });
    res.render("admin/user-detail.ejs", { user, products });
};

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/admin/users");
    }

    if (user.isAdmin) {
        req.flash("error", "Cannot delete another admin");
        return res.redirect("/admin/users");
    }

    const products = await Product.find({ owner: id });
    for (const product of products) {
        if (product.reviews && product.reviews.length > 0) {
            await Review.deleteMany({ _id: { $in: product.reviews } });
        }
    }
    await Product.deleteMany({ owner: id });
    await Review.deleteMany({ author: id });
    await User.findByIdAndDelete(id);

    req.flash("success", "User and related data deleted");
    res.redirect("/admin/users");
};

module.exports.listProducts = async (req, res) => {
    const products = await Product.find({}).populate("owner").sort({ createdAt: -1 });
    res.render("admin/products.ejs", { products });
};

module.exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    req.flash("success", "Product deleted");
    res.redirect("/admin/products");
};
