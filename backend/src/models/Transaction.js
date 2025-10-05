//backend/src/models/Transaction.js
const mongoose = require('mongoose');


const TransactionSchema = new mongoose.Schema({
authority: String,
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
payments: [{ billingMonthId: mongoose.Schema.Types.ObjectId, amount: Number }],
totalAmount: Number,
status: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Transaction', TransactionSchema);