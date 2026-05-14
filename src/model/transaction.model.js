const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'From account is required'],
        index: true
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'To account is required'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
            message: 'Status must be either pending, completed, or failed'
        },
        default: 'PENDING'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number']
    },
    idempotencyKey: {
        type: String,
        required: [true, 'Idempotency key is required'],
        index: true,
        unique: true
    }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
