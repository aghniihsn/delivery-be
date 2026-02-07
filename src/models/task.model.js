const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  title: String,
  address: String,
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'on_delivery', 'delivered', 'failed'],
    default: 'pending'
  },
  proofImage: String,
  deliveredAt: Date
})

module.exports = mongoose.model('Task', taskSchema)
