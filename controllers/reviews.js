const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");

module.exports.createReview = async (req, res) => {
    const product = await Product.findById(req.params.id);
    const newReview = new Review(req.body.review);
    
    newReview.author = req.user._id;
    newReview.product = product._id;
    
    product.reviews.push(newReview);
    
    await newReview.save();
    await product.save();
    
    // Update seller rating
    const seller = await User.findById(product.owner);
    const totalRating = seller.rating * seller.totalRatings + newReview.rating;
    seller.totalRatings += 1;
    seller.rating = totalRating / seller.totalRatings;
    await seller.save();
    
    req.flash("success", "Review added successfully!");
    res.redirect(`/products/${product._id}`);
};

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;
    
    await Product.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    req.flash("success", "Review deleted!");
    res.redirect(`/products/${id}`);
};