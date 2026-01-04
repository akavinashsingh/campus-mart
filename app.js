if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
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

const ExpressError = require("./utils/ExpressError.js");
const productRouter = require("./routes/products.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/users.js");
const adminRouter = require("./routes/admin.js");

const dbUrl = process.env.ATLASDB_URL;

// Database connection
main()
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
    await ensureDefaultAdmin();
}

async function ensureDefaultAdmin() {
    const username = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@campus.local";

    let admin = await User.findOne({ username });
    if (!admin) {
        admin = new User({
            username,
            email,
            college: "Administration",
            phone: "0000000000",
            isAdmin: true,
            isVerified: true,
        });
        await User.register(admin, password);
        console.log(`Default admin created: ${username} / ${password}`);
    } else {
        if (!admin.isAdmin) {
            admin.isAdmin = true;
        }
        // Always align the admin password with DEFAULT_ADMIN_PASSWORD so login works
        await admin.setPassword(password);
        await admin.save();
        console.log(`Default admin ensured. Username: ${username} / ${password}`);
    }
}

// App configuration
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
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
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages and current user
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
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
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error", { message });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});