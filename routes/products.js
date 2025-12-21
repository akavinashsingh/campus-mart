const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Product = require("../models/Product.js");
const { isLoggedIn, isOwner, validateProduct } = require("../middleware.js");
const productController = require("../controllers/products.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/")
    .get(wrapAsync(productController.index))
    .post(
        isLoggedIn,
        upload.array('product[images]', 5),
        validateProduct,
        wrapAsync(productController.createProduct)
    );

router.get("/new", isLoggedIn, productController.renderNewForm);
router.get("/search", wrapAsync(productController.searchProducts));

router.route("/:id")
    .get(wrapAsync(productController.showProduct))
    .put(
        isLoggedIn,
        isOwner,
        upload.array('product[images]', 5),
        validateProduct,
        wrapAsync(productController.updateProduct)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(productController.destroyProduct));

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(productController.renderEditForm));
router.post("/:id/sold", isLoggedIn, isOwner, wrapAsync(productController.markAsSold));

module.exports = router;