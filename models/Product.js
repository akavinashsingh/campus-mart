const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./Review.js");

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Books', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Other']
    },
    condition: {
        type: String,
        required: true,
        enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        required: true
    },
    images: [{
        url: String,
        filename: String
    }],
    location: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    isSold: {
        type: Boolean,
        default: false
    },
    isNegotiable: {
        type: Boolean,
        default: false
    },
    contactMethod: {
        type: String,
        enum: ['WhatsApp', 'Email', 'Phone', 'In-person'],
        default: 'WhatsApp'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

productSchema.post("findOneAndDelete", async (product) => {
    if (product) {
        await Review.deleteMany({ _id: { $in: product.reviews } });
    }
});

module.exports = mongoose.model("Product", productSchema);