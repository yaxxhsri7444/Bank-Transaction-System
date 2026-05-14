const mongoose = require('mongoose');
const Ledger = require('./ledger.model');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'FROZEN', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'INR'],
        required: [true, 'Currency is required'],
        default: 'INR'
    }
    // Remove: balance field (compute from ledgers instead)
}, {
    timestamps: true
});

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {
    const balanceData = await Ledger.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totaldebit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', 'DEBIT'] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalcredit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', 'CREDIT'] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalcredit", "$totaldebit"] }
            }
        }
    ]);

    if (balanceData.length === 0) {
        return 0;
    }

    return balanceData[0].balance;
};

const accountModel = mongoose.model('Account', accountSchema);
module.exports = accountModel;
