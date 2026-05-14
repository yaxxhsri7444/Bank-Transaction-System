const accountModel = require("../model/account.model");
const transactionModel = require("../model/transaction.model");
const ledgerModel = require("../model/ledger.model");
const { default: mongoose } = require("mongoose");

exports.createTransaction = async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }
console.log('Looking for accounts with:');
console.log('fromAccount ID:', fromAccount);
console.log('toAccount ID:', toAccount);
console.log('Current user ID:', req.user._id);

const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
    user: req.user._id,
});

console.log('Found fromUserAccount:', fromUserAccount);

const toUserAccount = await accountModel.findOne({
    _id: toAccount,
    user: req.user._id,
});

console.log('Found toUserAccount:', toUserAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({ message: "One or both accounts not found" });
  }

  // Check for existing transaction with the same idempotency key

  const isExistingTransaction = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isExistingTransaction) {
    if (isExistingTransaction.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already completed",
        transaction: isExistingTransaction,
      });
    }

    if (isExistingTransaction.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still pending",
        transaction: isExistingTransaction,
      });
    }

    if (isExistingTransaction.status === "FAILED") {
      return res.status(500).json({
        message: "Previous transaction attempt failed. You can retry.",
        transaction: isExistingTransaction,
      });
    }

    if (isExistingTransaction.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction was reversed. You can retry.",
        transaction: isExistingTransaction,
      });
    }
  }

  // check account status

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res
      .status(400)
      .json({ message: "One or both accounts are not active" });
  }

  // derive sender balance after ledger
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance in sender account. Current balance: ${balance}. Requested amount: ${amount}`,
    });
  }

  // Create transaction (PENDING)
  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = await transactionModel.create(
    [
      {
        fromAccount: fromAccount,
        toAccount: toAccount,
        amount: amount,
        idempotencyKey: idempotencyKey,
        status: "PENDING",
      },
    ],
    { session },
  );

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  res
    .status(201)
    .json({ message: "Transaction completed successfully", transaction });
};

exports.createInitialFundsTransaction = async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return res.status(404).json({ message: "Account not found" });
  }

  const fromUserAccount = await accountModel.findOne({
    systemUser: true,
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res
      .status(404)
      .json({ message: "System account not found for the user" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount: toAccount,
    amount: amount,
    idempotencyKey: idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res
    .status(201)
    .json({
      message: "Initial funds transaction completed successfully",
      transaction,
    });
};


