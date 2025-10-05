//backend/src/routes/bills
const express = require('express');
const router = express.Router();
const BillingItem = require('../models/BillingItem');
// FIX: Import the standard auth middleware
const { authMiddleware } = require('../middleware/auth'); 
const jwt = require('jsonwebtoken');


// Removed duplicated simple auth middleware (DRY violation)

// لیست ماه‌ها برای یک فروشگاه
router.get('/shop/:shopId', authMiddleware, async (req,res)=>{
const items = await BillingItem.find({ shop: req.params.shopId }).sort({ month: 1 });
res.json({ ok:true, items });
});


// ایجاد چند ماه بدهکاری (ادمین یا shop owner)
router.post('/shop/:shopId/create', authMiddleware, async (req,res)=>{
const { months } = req.body; // [{ month: '2025-01', amount: 1000000 }, ...]
const docs = months.map(m => ({ shop: req.params.shopId, month: m.month, amount: m.amount, remaining: m.amount }));
const created = await BillingItem.insertMany(docs);
res.json({ ok:true, created });
});


// بعد از پرداخت، endpoint برای کاهش remaining
// NOTE: این مسیر بهتر است به صورت داخلی در مسیر /payment/verify استفاده شود
// و مستقیماً توسط کلاینت فراخوانی نشود، مگر اینکه لایه‌ای از ادمین یا سرویس به آن دسترسی داشته باشد.
router.post('/apply-payment', authMiddleware, async (req,res)=>{
// body: { payments: [{ billingItemId, paidAmount }], transactionId }
const { payments, transactionId } = req.body;
const results = [];
for(const p of payments){
const item = await BillingItem.findById(p.billingItemId);
if(!item) continue;
const paid = Math.min(item.remaining, p.paidAmount);
item.remaining = item.remaining - paid;
await item.save();
results.push({ billingItemId: item._id, newRemaining: item.remaining, paid });
}
// میتوان این تراکنش را در کالکشن جدا ذخیره کرد (log)
res.json({ ok:true, results, transactionId });
});


module.exports = router;
