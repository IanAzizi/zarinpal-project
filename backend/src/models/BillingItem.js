//backend/src/models/BillingItem.js
const mongoose = require('mongoose');


const BillingItemSchema = new mongoose.Schema({
shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
month: String, // e.g. "2025-09"
amount: { type: Number, default: 0 },
remaining: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('BillingItem', BillingItemSchema);