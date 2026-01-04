const express = require("express");
const passport = require("passport");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const adminController = require("../controllers/admin.js");
const { isAdmin } = require("../middleware.js");

router.route("/login")
    .get(adminController.renderLoginForm)
    .post(
        passport.authenticate("local", {
            failureRedirect: "/admin/login",
            failureFlash: true,
        }),
        adminController.login
    );

router.post("/logout", adminController.logout);

router.get("/", isAdmin, wrapAsync(adminController.dashboard));
router.get("/users", isAdmin, wrapAsync(adminController.listUsers));
router.get("/users/:id", isAdmin, wrapAsync(adminController.userDetail));
router.delete("/users/:id", isAdmin, wrapAsync(adminController.deleteUser));
router.get("/products", isAdmin, wrapAsync(adminController.listProducts));
router.delete("/products/:id", isAdmin, wrapAsync(adminController.deleteProduct));

module.exports = router;
