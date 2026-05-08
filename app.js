if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/User.js");

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make io accessible to routes..
app.set('io', io);

const ExpressError = require("./utils/ExpressError.js");
const { convertMongooseError, logError } = require("./utils/errorHandler.js");
const productRouter = require("./routes/products.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/users.js");
const adminRouter = require("./routes/admin.js");

const dbUrl = process.env.ATLASDB_URL;

console.log("DEBUG: NODE_ENV =", process.env.NODE_ENV);
console.log("DEBUG: ATLASDB_URL defined?", !!dbUrl);

if (!dbUrl) {
    console.error("ERROR: ATLASDB_URL environment variable is not set!");
    process.exit(1);
}

// Database connection
main()
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("Database connection failed:", err.message);
        console.error("Application cannot start without database connection");
        process.exit(1);
    });

async function main() {
    await mongoose.connect(dbUrl);
    await ensureDefaultAdmin();
}

async function ensureDefaultAdmin() {
    const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@campus.local";
    const fullName = process.env.DEFAULT_ADMIN_NAME || "Administrator";
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";

    let admin = await User.findOne({ email });
    if (!admin) {
        admin = new User({
            email,
            fullName,
            college: "Administration",
            phone: "0000000000",
            isAdmin: true,
            isVerified: true,
        });
        await User.register(admin, password);
        console.log(`Default admin created: ${email} / ${password}`);
    } else {
        if (!admin.isAdmin) {
            admin.isAdmin = true;
        }
        // Always align the admin password with DEFAULT_ADMIN_PASSWORD so login works
        await admin.setPassword(password);
        await admin.save();
        console.log(`Default admin ensured. Email: ${email} / Password set`);
    }
}

// App configuration
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON request bodies
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
   /* crypto: {
        secret: process.env.SECRET,
    },*/
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Error in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "thisshouldbealongandcomplexsecretstring123!",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
// Use email as the username field for local authentication
passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages and current user
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Socket.IO connection handling for real-time notifications
io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    
    socket.on('join-admin', (adminId) => {
        socket.join(`admin-${adminId}`);
        console.log(`Admin ${adminId} joined notification room`);
    });
    
    socket.on('disconnect', () => {
        console.log('Admin disconnected:', socket.id);
    });
});

// Routes
app.use("/products", productRouter);
app.use("/products/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/admin", adminRouter);

// Home route
app.get("/", (req, res) => {
    res.redirect("/products");
});

// Sitemap route for SEO
app.get("/sitemap.xml", async (req, res) => {
    try {
        const Product = require("./models/Product");
        const products = await Product.find({ isSold: false }).select('_id updatedAt').lean();
        
        const baseUrl = process.env.BASE_URL || 'https://campusmart.com';
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Homepage
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/products</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';
        
        // Category pages
        const categories = ['Books', 'Electronics', 'Sports', 'Furniture', 'Clothing', 'Other'];
        categories.forEach(category => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/products?category=${encodeURIComponent(category)}</loc>\n`;
            xml += '    <changefreq>daily</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        });
        
        // Product pages
        products.forEach(product => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/products/${product._id}</loc>\n`;
            xml += `    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.6</priority>\n';
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('Sitemap generation error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

// Favicon handler - prevent 500 errors
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

// 404 Handler
app.all("/*any", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error Handler
app.use((err, req, res, next) => {
    // Check if a response has already been sent to avoid the Headers error
    if (res.headersSent) {
        return next(err);
    }
    
    // Convert Mongoose errors to ExpressError
    const mongooseError = convertMongooseError(err);
    if (mongooseError) {
        err = mongooseError;
    }
    
    // Log the error with context
    logError(err, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?._id,
        userEmail: req.user?.email
    });
    
    const { statusCode = 500, message = "Something went wrong!" } = err;
    
    // Don't expose internal details in production
    const displayMessage = statusCode === 500 && process.env.NODE_ENV === 'production' 
        ? 'Internal server error. Please try again later.'
        : message;
    
    // For JSON requests
    if (req.accepts('json') && req.headers['content-type']?.includes('application/json')) {
        return res.status(statusCode).json({
            success: false,
            error: displayMessage,
            statusCode
        });
    }
    
    // For HTML requests
    res.status(statusCode).render("error", { 
        message: displayMessage,
        statusCode,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Optionally exit process or log to error tracking service
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Exit after logging critical errors
    process.exit(1);
});