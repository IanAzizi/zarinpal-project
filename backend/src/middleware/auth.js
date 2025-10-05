//backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');


async function authMiddleware(req, res, next){
const header = req.headers.authorization;
if(!header) return res.status(401).json({ ok:false, error: 'no_token' });
const token = header.split(' ')[1];
try{
const payload = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(payload.id).select('-password');
if(!user) return res.status(401).json({ ok:false, error: 'invalid_user' });
req.user = user;
next();
}catch(e){
return res.status(401).json({ ok:false, error: 'invalid_token' });
}
}


function requireRole(role){
return (req,res,next)=>{
if(!req.user) return res.status(401).json({ ok:false });
if(req.user.role !== role && req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'forbidden' });
next();
};
}


module.exports = { authMiddleware, requireRole };