const Product = require("../models/Product");
const ContactLog = require("../models/ContactLog");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    try {
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
        
        // Build SEO data
        let pageTitle = 'CampusMart - Browse Student Marketplace';
        let pageDescription = 'Find amazing deals on books, electronics, sports equipment and more from fellow students. CampusMart is your campus marketplace.';
        
        if (category) {
            pageTitle = `${category} - CampusMart Student Marketplace`;
            pageDescription = `Browse ${category.toLowerCase()} items for sale by college students. Buy used ${category.toLowerCase()} at great prices on CampusMart.`;
        }
        
        res.render("products/index.ejs", { 
            allProducts, 
            filters: req.query,
            pageTitle,
            pageDescription,
            currentPath: req.path
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        req.flash("error", "Error loading products");
        res.redirect("/");
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("products/new.ejs", {
        pageTitle: 'Sell an Item - CampusMart',
        pageDescription: 'List your item for sale on CampusMart. Reach thousands of students on your campus.',
        currentPath: req.path
    });
};

module.exports.showProduct = async (req, res) => {
    try {
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
        
        // Track view: increment viewCount and record in viewHistory
        product.viewCount = (product.viewCount || 0) + 1;
        
        // Only record user views, not guest views
        if (req.user) {
            // Check if this user already viewed this product in the last hour to avoid spam
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentView = product.viewHistory.find(
                view => view.userId.toString() === req.user._id.toString() && 
                        view.viewedAt > oneHourAgo
            );
            
            // Only record if not viewed recently
            if (!recentView) {
                product.viewHistory.push({
                    userId: req.user._id,
                    viewedAt: new Date()
                });
            }
        }
        
        await product.save();
        
        // Build SEO data for product page
        const pageTitle = `${product.title} - ${product.category} | CampusMart`;
        const pageDescription = `${product.description ? product.description.substring(0, 155) : product.title + ' for sale on CampusMart'}. Price: $${product.price}. Condition: ${product.condition}.`;
        const ogImage = product.images && product.images.length > 0 ? product.images[0].url : '';
        
        // Structured data for product
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.title,
            "description": product.description || product.title,
            "image": product.images.map(img => img.url),
            "offers": {
                "@type": "Offer",
                "price": product.price,
                "priceCurrency": "USD",
                "availability": product.isSold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                "itemCondition": `https://schema.org/${product.condition === 'New' ? 'NewCondition' : 'UsedCondition'}`,
                "seller": {
                    "@type": "Person",
                    "name": product.owner.fullName || product.owner.username
                }
            },
            "category": product.category,
            "brand": product.brand || "Generic"
        };
        
        if (product.reviews && product.reviews.length > 0) {
            const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
            structuredData.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": avgRating.toFixed(1),
                "reviewCount": product.reviews.length
            };
        }
        
        res.render("products/show.ejs", { 
            product,
            pageTitle,
            pageDescription,
            ogImage,
            ogType: 'product',
            structuredData,
            currentPath: req.path
        });
    } catch (err) {
        console.error("Error showing product:", err);
        req.flash("error", "Error loading product");
        res.redirect("/products");
    }
};

module.exports.createProduct = async (req, res, next) => {
    try {
        const { title, price, category } = req.body.product;
        
        // Check for duplicate product from same owner with same title and price
        const existingProduct = await Product.findOne({
            owner: req.user._id,
            title: title,
            price: price,
            category: category,
            isSold: false
        });
        
        if (existingProduct) {
            req.flash("error", "You already have an active listing with this title and price. Please use a different title or price.");
            return res.redirect("/products/new");
        }
        
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
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            req.flash("error", "Product not found!");
            return res.redirect("/products");
        }
        
        res.render("products/edit.ejs", { 
            product,
            pageTitle: `Edit ${product.title} - CampusMart`,
            pageDescription: 'Edit your product listing on CampusMart.',
            currentPath: req.path
        });
    } catch (err) {
        console.error("Error loading edit form:", err);
        req.flash("error", "Error loading product");
        res.redirect("/products");
    }
};

module.exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, { ...req.body.product });
        
        if (!product) {
            req.flash("error", "Product not found!");
            return res.redirect("/products");
        }
        
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
    } catch (err) {
        console.error("Error updating product:", err);
        req.flash("error", "Error updating product");
        res.redirect("/products");
    }
};

module.exports.markAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, { isSold: true });
        
        if (!product) {
            req.flash("error", "Product not found!");
            return res.redirect("/products");
        }
        
        req.flash("success", "Product marked as sold!");
        res.redirect(`/products/${id}`);
    } catch (err) {
        console.error("Error marking product as sold:", err);
        req.flash("error", "Error updating product");
        res.redirect("/products");
    }
};

module.exports.destroyProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            req.flash("error", "Product not found!");
            return res.redirect("/products");
        }
        
        req.flash("success", "Product deleted successfully!");
        res.redirect("/products");
    } catch (err) {
        console.error("Error deleting product:", err);
        req.flash("error", "Error deleting product");
        res.redirect("/products");
    }
};

module.exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.redirect('/products');
        }
        
        const products = await Product.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ],
            isSold: false
        }).populate("owner");
        
        res.render("products/index.ejs", { 
            allProducts: products, 
            filters: req.query,
            pageTitle: `Search Results for "${q}" - CampusMart`,
            pageDescription: `Find ${q} on CampusMart student marketplace. Browse products from fellow students.`,
            currentPath: req.path
        });
    } catch (err) {
        console.error("Error searching products:", err);
        req.flash("error", "Error searching products");
        res.redirect("/products");
    }
};

module.exports.getSellerAnalytics = async (req, res) => {
    try {
        const products = await Product.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .populate("owner");
        
        // Calculate analytics
        const analytics = {
            totalListings: products.length,
            totalViews: 0,
            activeListings: 0,
            soldListings: 0,
            avgViewsPerListing: 0,
            topProducts: []
        };
        
        products.forEach(product => {
            analytics.totalViews += product.viewCount || 0;
            if (product.isSold) {
                analytics.soldListings++;
            } else {
                analytics.activeListings++;
            }
        });
        
        // Calculate average views
        if (analytics.totalListings > 0) {
            analytics.avgViewsPerListing = Math.round(analytics.totalViews / analytics.totalListings);
        }
        
        // Get top 5 products by views
        analytics.topProducts = products
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, 5);
        
        res.render("products/analytics.ejs", { 
            products, 
            analytics,
            pageTitle: 'My Listings Analytics - CampusMart',
            pageDescription: 'View analytics for your product listings on CampusMart.',
            currentPath: req.path
        });
    } catch (err) {
        req.flash("error", "Error loading analytics");
        res.redirect("/profile");
    }
};

module.exports.getProductAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id)
            .populate("owner")
            .populate("viewHistory.userId", "fullName email");
        
        if (!product) {
            req.flash("error", "Product not found!");
            return res.redirect("/analytics");
        }
        
        // Check if user is the owner
        if (!product.owner._id.equals(req.user._id)) {
            req.flash("error", "You can only view analytics for your own products!");
            return res.redirect("/analytics");
        }
        
        // Calculate view trends
        const viewsByDay = {};
        if (product.viewHistory && product.viewHistory.length > 0) {
            product.viewHistory.forEach(view => {
                const date = new Date(view.viewedAt).toLocaleDateString();
                viewsByDay[date] = (viewsByDay[date] || 0) + 1;
            });
        }
        
        // Get unique users who viewed
        const uniqueViewers = new Set(
            product.viewHistory
                .filter(v => v.userId)
                .map(v => v.userId._id.toString())
        ).size;
        
        res.render("products/product-analytics.ejs", { 
            product, 
            viewsByDay,
            uniqueViewers,
            totalViews: product.viewCount || 0,
            pageTitle: `Analytics for ${product.title} - CampusMart`,
            pageDescription: 'View detailed analytics for your product listing.',
            currentPath: req.path
        });
    } catch (err) {
        req.flash("error", "Error loading product analytics");
        res.redirect("/analytics");
    }
};

module.exports.logContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { contactMethod } = req.body;
        
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        
        // Don't log if seller is contacting their own product
        if (product.owner.equals(req.user._id)) {
            return res.json({ success: true, message: "Owner view, not logged" });
        }
        
        const contactLog = new ContactLog({
            product: product._id,
            seller: product.owner,
            buyer: req.user._id,
            contactMethod: contactMethod
        });
        
        await contactLog.save();
        
        // Populate the contact log for notification
        await contactLog.populate([
            { path: 'buyer', select: 'username fullName email' },
            { path: 'seller', select: 'username fullName email' },
            { path: 'product', select: 'title price' }
        ]);
        
        // Emit real-time notification to admin
        const io = req.app.get('io');
        if (io) {
            io.emit('new-buyer-contact', {
                message: `New buyer contact: ${contactLog.buyer.fullName} contacted ${contactLog.seller.fullName} about "${contactLog.product.title}"`,
                contact: contactLog,
                timestamp: new Date().toLocaleString()
            });
        }
        
        res.json({ success: true, message: "Contact logged" });
    } catch (err) {
        console.error("Error logging contact:", err);
        res.status(500).json({ success: false, message: "Error logging contact" });
    }
};