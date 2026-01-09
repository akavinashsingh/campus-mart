const Product = require("./models/Product");
const Review = require("./models/Review");
const ExpressError = require("./utils/ExpressError.js");
const { productSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to perform this action");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that");
        return res.redirect(`/products/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that");
        return res.redirect(`/products/${req.params.id}`);
    }
    next();
};

module.exports.isNotProductOwner = async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (product.owner.equals(req.user._id)) {
        req.flash("error", "You cannot comment on your own product");
        return res.redirect(`/products/${id}`);
    }
    next();
};

module.exports.validateProduct = (req, res, next) => {
    const { error } = productSchema.validate(req.body);
    
    if (error) {
        const errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    
    if (error) {
        const errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        req.flash("error", "Admin access required");
        return res.redirect("/admin/login");
    }
    next();
};