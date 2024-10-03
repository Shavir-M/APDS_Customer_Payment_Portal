const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user making the payment
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  recipientAccount: {
    type: String,
    required: true,
  },
  swiftCode: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: 'pending',
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
