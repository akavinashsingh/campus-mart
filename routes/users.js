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

router.get("/verify", wrapAsync(userController.verifyEmail));

router.get("/logout", userController.logout);
router.get("/profile", isLoggedIn, userController.renderProfile);
router.put("/profile/:id", isLoggedIn, upload.single('profileImage'), wrapAsync(userController.updateProfile));

module.exports = router;