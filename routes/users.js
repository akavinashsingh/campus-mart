const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
// routes/users.js
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/users.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );

router.route("/forgot-password")
    .get(userController.renderForgotPasswordForm)
    .post(wrapAsync(userController.forgotPassword));

router.route("/reset-password")
    .get(wrapAsync(userController.renderResetPasswordForm));

router.route("/reset-password/:token")
    .post(wrapAsync(userController.resetPassword));

router.get("/verify", wrapAsync(userController.verifyEmail));

router.get("/logout", userController.logout);
router.get("/profile", isLoggedIn, wrapAsync(userController.renderProfile));
router.get("/user/:id", wrapAsync(userController.viewUserProfile));
router.put("/profile/:id", isLoggedIn, upload.single('profileImage'), wrapAsync(userController.updateProfile));

// API endpoint for fetching user's products
router.get("/api/my-products", isLoggedIn, wrapAsync(userController.getMyProducts));

// Save/unsave product routes
router.post("/api/products/:id/save", isLoggedIn, wrapAsync(userController.saveProduct));
router.delete("/api/products/:id/save", isLoggedIn, wrapAsync(userController.unsaveProduct));
router.get("/saved-items", isLoggedIn, wrapAsync(userController.getSavedItems));

module.exports = router;