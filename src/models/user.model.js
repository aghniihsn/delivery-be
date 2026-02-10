const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'driver'], default: 'driver' },
  profileCompleted: { type: Boolean, default: false },
  currentLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);