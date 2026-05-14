const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.userId);
        if (!currentUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }   
        req.user = currentUser;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

const authSystemUserMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access, token is missing' });
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("+systemUser"); 

        if(!user.systemUser){
            return res.status(403).json({ message: 'Forbidden access, user is not a system user' });
        }

        req.user = user;

        next();
    }
    catch(error){
        return res.status(401).json({ message: 'Unauthorized access, invalid token' });
    }
}

module.exports = {authMiddleware, authSystemUserMiddleware};
