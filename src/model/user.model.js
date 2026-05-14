const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for creating user"],
        trim: true,
        unique: [true, "Email already exists"],
        match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    name: {
        type: String,
        required: [true, "Name is required for creating user"],
        trim: true,

    },
    password: {
        type: String,
        required: [true, "Password is required for creating user"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    },
},{ timestamps: true }
);


// Pre-save hook to hash the password before saving the user document
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return
});

// Method to compare candidate password with the stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

// Override the toJSON method to exclude the password field when converting to JSON
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
}

// Create the User model using the userSchema and export it
const User = mongoose.model('User', userSchema);
module.exports = User;
