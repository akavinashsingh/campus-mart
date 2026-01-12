const Product = require("./models/Product");
const Review = require("./models/Review");
const ExpressError = require("./utils/ExpressError.js");
const { formatValidationError } = require("./utils/errorHandler.js");
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
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new ExpressError(400, "Invalid product ID format");
        }
        
        const product = await Product.findById(id);
        
        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/products");
        }
        
        if (!product.owner.equals(req.user._id)) {
            req.flash("error", "You don't have permission to do that");
            return res.redirect(`/products/${id}`);
        }
        next();
    } catch (err) {
        if (err instanceof ExpressError) {
            throw err;
        }
        req.flash("error", "Error checking permissions");
        res.redirect("/products");
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        
        // Validate ID format
        if (!reviewId.match(/^[0-9a-fA-F]{24}$/)) {
            throw new ExpressError(400, "Invalid review ID format");
        }
        
        const review = await Review.findById(reviewId);
        
        if (!review) {
            req.flash("error", "Comment not found");
            return res.redirect("/products");
        }
        
        if (!review.author.equals(req.user._id)) {
            req.flash("error", "You don't have permission to do that");
            return res.redirect(`/products/${req.params.id}`);
        }
        next();
    } catch (err) {
        if (err instanceof ExpressError) {
            throw err;
        }
        req.flash("error", "Error checking permissions");
        res.redirect("/products");
    }
};

module.exports.isNotProductOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new ExpressError(400, "Invalid product ID format");
        }
        
        const product = await Product.findById(id);
        
        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/products");
        }
        
        if (product.owner.equals(req.user._id)) {
            req.flash("error", "You cannot comment on your own product");
            return res.redirect(`/products/${id}`);
        }
        next();
    } catch (err) {
        if (err instanceof ExpressError) {
            throw err;
        }
        req.flash("error", "Error checking permissions");
        res.redirect("/products");
    }
};

module.exports.validateProduct = (req, res, next) => {
    const { error } = productSchema.validate(req.body);
    
    if (error) {
        const errMsg = error.details.map(el => el.message).join("; ");
        throw new ExpressError(400, `Validation Error: ${errMsg}`);
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    
    if (error) {
        const errMsg = error.details.map(el => el.message).join("; ");
        throw new ExpressError(400, `Validation Error: ${errMsg}`);
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        req.flash("error", "Admin access required");
        return res.redirect("/admin/login");
    }
    next();
};