const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction is required'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: {
            values: ['CREDIT', 'DEBIT'],
            message: 'Type must be either credit or debit'
        },
        immutable: true
    }
});

function preventLedgerModification() {
    // Implementation for preventing ledger modifications
    throw new Error('Ledger entries cannot be modified or deleted after creation');
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('save', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);



const Ledger = mongoose.model('Ledger', ledgerSchema);
module.exports = Ledger;