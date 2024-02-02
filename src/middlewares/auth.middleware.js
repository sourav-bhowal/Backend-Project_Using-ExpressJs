import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js"

export const verifyJWT = asyncHandler( async(req, res, next) => {   // since "res" is not used "_" can be used in production level
    try {
        // taking the token from cookie or header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new apiError(401, "Unauthorized request");
        }
    
        // verifying the "incoming access token" from the user with the "access token" we had on the server using jwt
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new apiError(401, "Invalid Access Token");
        }
    
        req.user = user;
        next(); // "next" procceds for next step that is the "logout function" in "user.controller.js"
    } 
    catch (error) {
        throw new apiError(401, error?.message || "Invalid Access Token");
    }

} );