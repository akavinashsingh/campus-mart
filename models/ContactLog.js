const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactLogSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    contactMethod: {
        type: String,
        enum: ['Email', 'WhatsApp', 'Phone', 'In-person'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("ContactLog", contactLogSchema);
