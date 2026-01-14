const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");

module.exports.createReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('owner');
        
        if (!product) {
            req.flash("error", "Product not found!");
            return res.redirect("/products");
        }
        
        console.log("Product owner ID:", product.owner._id);
        console.log("Product owner before update:", product.owner.totalComments);
        
        const newReview = new Review(req.body.review);
        
        newReview.author = req.user._id;
        newReview.product = product._id;
        
        product.reviews.push(newReview);
        
        await newReview.save();
        await product.save();
        
        // Increment seller's total comments count
        const updatedUser = await User.findByIdAndUpdate(
            product.owner._id, 
            { $inc: { totalComments: 1 } },
            { new: true }
        );
        
        console.log("Product owner after update:", updatedUser.totalComments);
        
        req.flash("success", "Comment added successfully!");
        res.redirect(`/products/${product._id}`);
    } catch (err) {
        console.error("Error creating review:", err);
        req.flash("error", "Error adding comment");
        res.redirect("/products");
    }
};

module.exports.destroyReview = async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        
        // Get the product with owner info before deleting
        const product = await Product.findById(id).populate('owner');
        
        await Product.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        
        // Decrement seller's total comments count
        if (product && product.owner) {
            await User.findByIdAndUpdate(product.owner._id, {
                $inc: { totalComments: -1 }
            });
        }
        
        req.flash("success", "Comment deleted!");
        res.redirect(`/products/${id}`);
    } catch (err) {
        console.error("Error deleting review:", err);
        req.flash("error", "Error deleting comment");
        res.redirect("/products");
    }
};