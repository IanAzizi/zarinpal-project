//backend/src/models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
name: String,
email: { type: String, unique: true },
password: String,
role: { type: String, enum: ['user','shop','admin'], default: 'user' },
shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null }
});
module.exports = mongoose.model('User', UserSchema);