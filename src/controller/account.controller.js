const accountModel = require('../model/account.model');

exports.createAccount = async (req, res) => {
    const user = req.user;

    const account = await accountModel.create({
        user: user._id,
        status: 'ACTIVE',
        currency: req.body.currency || 'INR',
        balance: 0
    });

    try {
        const savedAccount = await account.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(500).json({ message: 'Error creating account', error });
    }
}

exports.getUserAccounts = async (req, res) =>{
   const accounts = await accountModel.find({ user: req.user._id });
    res.status(200).json(accounts);
    
}