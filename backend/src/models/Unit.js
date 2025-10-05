//backend/src/models/Unit.js
const mongoose = require('mongoose');


const BillingMonthSchema = new mongoose.Schema({
month: { type: String, required: true }, // e.g. "2025-09"
amount: { type: Number, required: true }, // مبلغ کل برای آن ماه
remaining: { type: Number, required: true }, // مانده بدهی (init = amount)
createdAt: { type: Date, default: Date.now }
});


const UnitSchema = new mongoose.Schema({
name: { type: String, required: true }, // اسم واحد به دلخواه
ownerName: { type: String },
address: { type: String },
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ادمین یا منیجر که ساخته
billingMonths: [BillingMonthSchema]
}, { timestamps: true });


module.exports = mongoose.model('Unit', UnitSchema);