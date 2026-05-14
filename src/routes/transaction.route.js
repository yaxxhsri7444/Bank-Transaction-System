const { Router } = require("express");
const transactionController = require("../controller/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = Router();

router.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction,
);

router.post(
  "/system/initial-funds",
  authMiddleware.authSystemUserMiddleware,
  transactionController.createInitialFundsTransaction,
);

module.exports = router;

