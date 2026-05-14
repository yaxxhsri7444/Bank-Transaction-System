const express = require('express');
const authmiddleware = require('../middleware/auth.middleware');
const accountController = require('../controller/account.controller');


const router = express.Router();

router.post('/', authmiddleware.authMiddleware, accountController.createAccount);
router.get('/user', authmiddleware.authMiddleware, accountController.getUserAccounts);

module.exports = router;