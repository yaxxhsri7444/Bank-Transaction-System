const User = require('../model/user.model');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "Email already exists", status: "failed" });
    }

    try {
        const user = new User({ email, password, name });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(201).json({ 
            user: { _id: user._id, email: user.email, name: user.name }, 
            message: "User registered successfully", 
            status: "success", 
            token 
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", status: "failed", error: error.message });
    }
}
exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password", status: "failed" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password", status: "failed" });
    }

    try {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(200).json({ 
            user: { _id: user._id, email: user.email, name: user.name }, 
            message: "User logged in successfully", 
            status: "success", 
            token 
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", status: "failed", error: error.message });
    }
}

