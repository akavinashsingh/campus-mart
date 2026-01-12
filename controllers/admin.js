const User = require("../models/User");
const Product = require("../models/Product");
const Review = require("../models/Review");
const ContactLog = require("../models/ContactLog");

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
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ isSold: false });
        const recentContacts = await ContactLog.find({})
            .populate('product', 'title')
            .populate('seller', 'fullName username')
            .populate('buyer', 'fullName username')
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.render("admin/dashboard.ejs", { 
            stats: { totalUsers, totalProducts, activeProducts }, 
            recentContacts 
        });
    } catch (err) {
        console.error("Error loading dashboard:", err);
        req.flash("error", "Error loading dashboard");
        res.redirect("/admin/login");
    }
};

module.exports.listUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.render("admin/users.ejs", { users });
    } catch (err) {
        console.error("Error listing users:", err);
        req.flash("error", "Error loading users");
        res.redirect("/admin");
    }
};

module.exports.userDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/users");
        }
        const products = await Product.find({ owner: id }).sort({ createdAt: -1 });
        res.render("admin/user-detail.ejs", { user, products });
    } catch (err) {
        console.error("Error loading user details:", err);
        req.flash("error", "Error loading user details");
        res.redirect("/admin/users");
    }
};

module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash("error", "Invalid user ID");
            return res.redirect("/admin/users");
        }
        
        const user = await User.findById(id);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/users");
        }

        if (user.isAdmin) {
            req.flash("error", "Cannot delete another admin");
            return res.redirect("/admin/users");
        }

        // Delete user's products, reviews, and contacts
        const products = await Product.find({ owner: id });
        for (const product of products) {
            if (product.reviews && product.reviews.length > 0) {
                await Review.deleteMany({ _id: { $in: product.reviews } });
            }
        }
        await Product.deleteMany({ owner: id });
        await Review.deleteMany({ author: id });
        await ContactLog.deleteMany({ $or: [{ buyer: id }, { seller: id }] });
        await User.findByIdAndDelete(id);

        req.flash("success", "User and related data deleted successfully");
        res.redirect("/admin/users");
    } catch (err) {
        console.error("Error deleting user:", err);
        req.flash("error", "Error deleting user. Please try again.");
        res.redirect("/admin/users");
    }
};

module.exports.listProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate("owner").sort({ createdAt: -1 });
        res.render("admin/products.ejs", { products });
    } catch (err) {
        console.error("Error listing products:", err);
        req.flash("error", "Error loading products");
        res.redirect("/admin");
    }
};

module.exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash("error", "Invalid product ID");
            return res.redirect("/admin/products");
        }
        
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/admin/products");
        }
        
        // Clean up associated reviews and contacts
        if (product.reviews && product.reviews.length > 0) {
            await Review.deleteMany({ _id: { $in: product.reviews } });
        }
        await ContactLog.deleteMany({ product: id });
        
        req.flash("success", "Product and related data deleted successfully");
        res.redirect("/admin/products");
    } catch (err) {
        console.error("Error deleting product:", err);
        req.flash("error", "Error deleting product. Please try again.");
        res.redirect("/admin/products");
    }
};
