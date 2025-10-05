//backend/src/models/Shop.js
const mongoose = require('mongoose');
const ShopSchema = new mongoose.Schema({
name: String,
owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
module.exports = mongoose.model('Shop', ShopSchema);