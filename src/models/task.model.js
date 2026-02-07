const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  taskId: { type: String, required: true, unique: true }, 
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'delivered'], 
    default: 'pending' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: { type: String }, 
  destination: {
    address: String,
    latitude: Number,
    longitude: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);