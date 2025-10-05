//backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// register (for admin creation testing) - protect this in prod
router.post('/register', async (req,res)=>{
try{
const { name, email, password, role } = req.body;
if(!name || !email || !password) return res.status(400).json({ ok:false, error:'missing' });
const exists = await User.findOne({ email });
if(exists) return res.status(400).json({ ok:false, error:'exists' });
const hashed = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, password: hashed, role: role || 'user' });
res.json({ ok:true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}catch(e){
res.status(500).json({ ok:false, error: e.message });
}
});


// login
router.post('/login', async (req,res)=>{
try{
const { email, password } = req.body;
if(!email || !password) return res.status(400).json({ ok:false });
const user = await User.findOne({ email });
if(!user) return res.status(401).json({ ok:false, error:'invalid' });
const match = await bcrypt.compare(password, user.password);
if(!match) return res.status(401).json({ ok:false, error:'invalid' });
// FIX: Add user role to the JWT payload
const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' }); 
res.json({ ok:true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}catch(e){
res.status(500).json({ ok:false, error: e.message });
}
});


module.exports = router;
