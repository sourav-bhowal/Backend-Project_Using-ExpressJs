import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required."],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        lowercase: true,
        trim: true,   
    },
    fullname: {
        type: String,
        required: [true, "Fullname is required."],
        trim: true,
        index: true,
    },
    avatar: {
        type: String,   // cloudinary url for avatar image
        required: [true, "Avatar is required."],
    },
    coverImage: {
        type: String,   // cloudinary url for avatar image 
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        }   
    ],
    password: {
        type: String,
        required: [true, "Password is required."],
    },
    refreshToken: {
        type: String,
    }
}, {timestamps: true});


// using bcrypt to encrypt the password when their is a change in the "password field".
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});


/* WE CAN CREATE OUR OWN METHODS IN THE SCHEMAS THAT WE HAVE DEFINED */

// using bcrypt to create a method to check wether the "password" is correct or not.
userSchema.methods.isPasswordCorrect = async function (password){   
    return await bcrypt.compare(password, this.password)
};
// using jwt to generate AccessToken
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,  // left part is our variable for jwt, Right part i.e. "this" part is coming from db.
            username: this.username,
            fullname: this.fullname, 
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};
// using jwt to generate RefreshToken
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};


export const User = mongoose.model('User', userSchema);