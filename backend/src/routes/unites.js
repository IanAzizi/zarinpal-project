//backend/src/routes/unties.js
 express = require('express');
// FIX: Define the router instance
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth'); 
const Unit = require('../models/Unit'); // Assuming Unit model is imported here


// Create a unit (admin or manager)
router.post('/', authMiddleware, requireRole('manager'), async (req,res)=>{
try{
const { name, ownerName, address } = req.body;
if(!name) return res.status(400).json({ ok:false, error: 'missing_name' });
const u = await Unit.create({ name, ownerName, address, createdBy: req.user._id, billingMonths: [] });
res.json({ ok:true, unit: u });
}catch(e){
res.status(500).json({ ok:false, error: e.message });
}
});


// Add billing months to a unit
router.post('/:unitId/months', authMiddleware, requireRole('manager'), async (req,res)=>{
// body: { months: [{ month: '2025-09', amount: 1000000 }, ...] }
try{
const { months } = req.body;
if(!Array.isArray(months) || months.length===0) return res.status(400).json({ ok:false, error:'no_months' });
const unit = await Unit.findById(req.params.unitId);
if(!unit) return res.status(404).json({ ok:false, error:'unit_not_found' });
for(const m of months){
const existing = unit.billingMonths.find(b => b.month === m.month);
if(existing){
// update existing
existing.amount = m.amount;
existing.remaining = m.amount; // reset remaining to amount (or choose different logic)
}else{
unit.billingMonths.push({ month: m.month, amount: m.amount, remaining: m.amount });
}
}
await unit.save();
res.json({ ok:true, unit });
}catch(e){
res.status(500).json({ ok:false, error: e.message });
}
});


// List units (with billing months) - supports optional query ?q=...
router.get('/', authMiddleware, async (req,res)=>{
try{
const units = await Unit.find().sort({ name: 1 }).lean();
res.json({ ok:true, units });
}catch(e){
res.status(500).json({ ok:false, error: e.message });
}
});


// Get a single unit
router.get('/:unitId', authMiddleware, async (req,res)=>{
try{
const unit = await Unit.findById(req.params.unitId);
if(!unit) return res.status(404).json({ ok:false, error:'unit_not_found' });
res.json({ ok:true, unit });
}catch(e){
res.status(500).json({ ok:false, error: e.message });
}
});


module.exports = router;
