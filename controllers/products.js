const Product = require("../models/Product");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const { category, college, condition, minPrice, maxPrice, sort } = req.query;
    let query = { isSold: false };
    
    if (category) query.category = category;
    if (college) query.college = college;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Build sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (sort === 'price-low') {
        sortOptions = { price: 1 };
    } else if (sort === 'price-high') {
        sortOptions = { price: -1 };
    } else if (sort === 'oldest') {
        sortOptions = { createdAt: 1 };
    }
    
    const allProducts = await Product.find(query)
        .populate("owner")
        .sort(sortOptions);
    
    res.render("products/index.ejs", { allProducts, filters: req.query });
};

module.exports.renderNewForm = (req, res) => {
    res.render("products/new.ejs");
};

module.exports.showProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");
    
    if (!product) {
        req.flash("error", "Product not found!");
        return res.redirect("/products");
    }
    
    res.render("products/show.ejs", { product });
};

module.exports.createProduct = async (req, res, next) => {
    try {
        const newProduct = new Product(req.body.product);
        newProduct.owner = req.user._id;
        newProduct.college = req.user.college;
        
        if (req.files) {
            newProduct.images = req.files.map(f => ({
                url: f.path,
                filename: f.filename
            }));
        }
        
        await newProduct.save();
        req.flash("success", "Product listed successfully!");
        res.redirect(`/products/${newProduct._id}`);
    } catch (err) {
        next(err);
    }
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
        req.flash("error", "Product not found!");
        return res.redirect("/products");
    }
    
    res.render("products/edit.ejs", { product });
};

module.exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { ...req.body.product });
    
    if (req.files && req.files.length > 0) {
        const images = req.files.map(f => ({
            url: f.path,
            filename: f.filename
        }));
        product.images.push(...images);
        await product.save();
    }
    
    req.flash("success", "Product updated successfully!");
    res.redirect(`/products/${id}`);
};

module.exports.markAsSold = async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndUpdate(id, { isSold: true });
    req.flash("success", "Product marked as sold!");
    res.redirect(`/products/${id}`);
};

module.exports.destroyProduct = async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    req.flash("success", "Product deleted successfully!");
    res.redirect("/products");
};

module.exports.searchProducts = async (req, res) => {
    const { q } = req.query;
    const products = await Product.find({
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } }
        ],
        isSold: false
    }).populate("owner");
    
    res.render("products/index.ejs", { allProducts: products });
};