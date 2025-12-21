const Joi = require('joi');

module.exports.productSchema = Joi.object({
    product: Joi.object({
        title: Joi.string().required().max(100),
        description: Joi.string().required().max(1000),
        category: Joi.string().valid('Books', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Other').required(),
        condition: Joi.string().valid('New', 'Like New', 'Good', 'Fair', 'Poor').required(),
        price: Joi.number().required().min(0),
        originalPrice: Joi.number().required().min(0),
        location: Joi.string().required(),
        isNegotiable: Joi.boolean(),
        contactMethod: Joi.string().valid('WhatsApp', 'Email', 'Phone', 'In-person')
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required().max(500)
    }).required()
});

module.exports.userSchema = Joi.object({
    user: Joi.object({
        username: Joi.string().required().min(3).max(30),
        email: Joi.string().email().required(),
        college: Joi.string().required(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required()
    }).required()
});