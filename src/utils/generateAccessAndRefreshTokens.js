import { User } from "../models/user.models.js";
import apiError from "./apiError.js";

export const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;   // assigning new refresh token

        await user.save({ validateBeforeSave: false }); // saving the user in DB

        return {accessToken, refreshToken};
    } 
    catch (error) {
        throw new apiError(500, "Something went wrong while generating access token & refresh token")
    }
};