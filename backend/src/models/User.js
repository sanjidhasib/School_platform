const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: Object.values(ROLES), required: true },
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
