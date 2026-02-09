const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  from: String,
  to: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  taskId: { type: String, required: true, unique: true }, 
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'on_delivery', 'delivered', 'rescheduled', 'failed'], 
    default: 'pending' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  imageUrl: { type: String }, 
  destination: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  recipientName: { type: String, default: '' },
  recipientPhone: { type: String, default: '' },
  notes: { type: String, default: '' },
  failedReason: { type: String, default: '' },
  rescheduledDate: { type: Date, default: null },
  rescheduledReason: { type: String, default: '' },
  assignedAt: { type: Date, default: null },
  pickedUpAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  statusHistory: [statusHistorySchema],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);