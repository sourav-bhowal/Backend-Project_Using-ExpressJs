import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshTokens.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


export const registerUser = asyncHandler( async(req, res) => {

    /* STEPS TO FOLLOW TO REGISTER A USER */
    // get the user details from frontend
    // validation - not empty
    // check if already user exists: check with both username and email
    // check for images not compulsory, check for avatar which is compulsory
    // upload images & avatar to cloudinary, check for successfully uploaded avatar
    // create user object - create entry in DB
    // remove "password" & "refresh_token" fields from response
    // check for user creation "(response)" wheather "response" has generated or not
    // return "response"

    // Validations................................................................
    const { fullname, email, username, password } = req.body; // every field comes from the body
    // console.log("email:", email, password);

    if(fullname === "") {
        throw new apiError(400, "fullname is required.");
    }

    if(email === "") {
        throw new apiError(400, "email is required.");
    }

    const atpos = email.indexOf("@"); // check of "@" in an email for valid email
    if(atpos === -1) {
        throw new apiError(400, "email is invalid.");
    }
    
    if(username === "") {
        throw new apiError(400, "username is required.");
    }

    if(password === "" || password.length < 8) {
        throw new apiError(400, "password is required or invalid.");
    }


    // Checking in the DB for matching email & username
    const existedUser = await User.findOne({  
        $or: [{ email }, { username }] // "$or" operator is used to take an array of checking fields
    });

    if(existedUser) {
        throw new apiError(400, "user already exists");
    }


    // Algo for getting the files from [0] position i.e. the first position

    // const avatarLocalPath = req.files?.avatar[0]?.path; -- not working //
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; --- not working //
    
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    } // we are writing "files" instead of "file" as we are taking both files i.e. "avatar" & "coverImage"

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required");
    }


    // Uploading the files on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new apiError(400, "Avatar is required");
    }


    // Saving the data of the USER on the DB
    const user = await User.create({ 
        fullname,
        avatar: {url: avatar.url, public_id: avatar.public_id}, // storing only avatar url, public_id on the DB. URL, public_id is coming from cloudinary
        coverImage: {url: coverImage?.url, public_id: coverImage?.public_id} || "", // "?" as their might not be a cover image always
        email,
        password,
        username: username.toLowerCase()
    });


    // Check for newly created user
    const createdUser = await User.findById(user._id).select( 
        // by default all fields are selected in "select" so "minus sign" is used to exclude the fields we dont want to select
        "-password -refreshToken -avatar._id -coverImage._id"   
    );

    if(!createdUser){
        throw new apiError(500, "user registration error.");
    }

    
    // Returning the Response
    return res
    .status(201)
    .json(new apiResponse(200, createdUser, "user registered successfully"))
   
} );


export const loginUser = asyncHandler( async(req, res) => {

    /* STEPS TO FOLLOW TO LOGIN A USER */
    // take data from "req.body"
    // giving access to the user as per username or email
    // find the user
    // check "password" if its wrong say that password is wrong
    // generate access token & refresh token
    // send "cookies" to the user
    // return "response" to the user

    // Taking data from req.body
    const { email, username, password } = req.body;

    if(!(username || email)) { // checking for either username or email
        throw new apiError(400, "username or email is required.")
    }

    // Checking in the DB either for matching email or username
    const user = await User.findOne({    
        $or: [{ email }, { username }]
    });

    if(!user) {
        throw new apiError(400, "User not found");
    }

    // Checking for valid password
    const isPasswordValid = await user.isPasswordCorrect(password); 

    if(!isPasswordValid) {
        throw new apiError(400, "Password is not correct");
    }

    // Generate access token & refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // taking the user from DB
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -avatar._id -coverImage._id");
    
    // Declaring few options
    const options = {
        httpOnly: true,
        secure: true,
    }

    // Returning the response with options & cookies
    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully."
        )
    )

} );


export const logoutUser = asyncHandler( async(req, res) => {

    // Finding the user from DB using _id and updating it 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 } // this removes the field from the document
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully."))

} );


export const refreshAccessToken = asyncHandler( async(req, res) => {

    // getting the "incoming refresh token" from the user as we also have a refresh token
    const incomingRefreshTokenFromUser = req.cookies.refreshToken || req.body.refreshToken;

    if (! incomingRefreshTokenFromUser) {
        throw new apiError(401, "Unauthorized request.");
    }

    try {
        // verifying the "incoming refresh token" from the user with the "refresh token" we had on the server using jwt
        const decodedToken = jwt.verify(incomingRefreshTokenFromUser, process.env.REFRESH_TOKEN_SECRET);
        
        // taking the user from DB using the decodedToken
        const user = await User.findById(decodedToken?._id);
    
        if(!user) {
            throw new apiError(401, "Invalid refresh token.");
        }
    
        // matching the "incoming refresh token" from the user and the "refresh token" of the user we have in DB
        if (incomingRefreshTokenFromUser !== user?.refreshToken) {
            throw new apiError(401, "Refresh Token is expired or used.");
        }
    
        const options = {   // creating options
            httpOnly: true,
            secure: true
        }
    
        // getting the tokens from the our function
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        // Returning response
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new apiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token refreshed successfully."
        ))
    } 
    catch (error) {
        throw new apiError(401, error?.message, "Invalid refresh token");
    }

} );


export const getCurrentUser = asyncHandler( async(req, res) => {

    // returning the current user
    return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully."));
} );


export const changeCurrentUserPassword = asyncHandler( async(req, res) => {
    
    // Taking the old and new password from the user using req.body
    const { oldPassword, newPassword } = req.body;

    // finding the user in DB from req.body as user is already logged in if he had to change his password
    const user = await User.findById(req.user?._id);

    // checking wheather the old_password is correct or not
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isOldPasswordCorrect) {
        throw new apiError(401, "Invalid old password");
    }

    // assigning the new password to the user
    user.password = newPassword;

    // saving the user to DB with updated password
    await user.save({validationBeforeSave: false});

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully."))


} );


export const updateUserDetails = asyncHandler( async(req, res) => {

    // Taking the input from user he/she wants to update or change from "req.body"
    const { fullname, email } = req.body;

    if(!(fullname || email)) {
        throw new apiError(400, "All fields are required.");
    }

    const atpos = email.indexOf("@"); // check of "@" in an email for valid email
    if(atpos === -1) {
        throw new apiError(400, "email is invalid.");
    }

    // finding the user from DB & updating it
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            // $set: {fullname: fullname, email: email}
            $set: {fullname, email} // you can write like this also
        },
        {new: true}
    ).select("-password -avatar._id -coverImage._id") // we don't want password field


    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user, "User updated successfully."));

} );


export const updateUserAvatar = asyncHandler( async(req, res) => {

    // taking the new avatar file
    const newAvatarLocalPath = req.file?.path; // we are writing "file" instead of "files" as we are changing only one file i.e. "avatar"

    if (!newAvatarLocalPath) {
        throw new apiError(404, "Avatar file not found.");
    }

    // uploading new avatar on cloudinary
    const newAvatar = await uploadOnCloudinary(newAvatarLocalPath);

    if(!newAvatar) { // we only need the new avatar url not whole object
        throw new apiError(404, "Avatar file not found");
    }

    // storing old avatar public_id from DB in a variable
    const oldAvatarPublicId = req.user?.avatar.public_id;

    // finding & updating the user on the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {avatar: {url: newAvatar.url, public_id: newAvatar.public_id}}  // we only need the new avatar url & public_id not whole object
        },
        {new: true}
    ).select("-password -avatar._id -coverImage._id");  // we dont want password field
    
    // deleting old avatar on cloudinary
    const oldAvatarDeleted = await deleteOnCloudinary(oldAvatarPublicId);
    
    if(!oldAvatarDeleted) {
        throw new apiError(404, "Old avatar not deleted");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar updated successfully."));

} );


export const updateUserCoverImage = asyncHandler( async(req, res) => {

    // Taking the new cover image file
    const newCoverImageLocalPath = req.file?.path; // we are writing "file" instead of "files" as we are changing only one file i.e. "avatar"

    if (!newCoverImageLocalPath) {
        throw new apiError(404, "Cover Image file not found.");
    }

    // Uploading new cover-image on cloudinary
    const newCoverImage = await uploadOnCloudinary(newCoverImageLocalPath);

    if(!newCoverImage) { // we only need the new cover image url not whole object
        throw new apiError(404, "Cover Image file not found");
    }

    // storing old coverImage public_id from DB in a variable
    const oldCoverImagePublicId = req.user?.coverImage.public_id;
    // Finding & updating the user on the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {coverImage: {url: newCoverImage.url, public_id: newCoverImage.public_id}}  // we only need the new cover image url & public_id not whole object
        },
        {new: true}
    ).select("-password -avatar._id -coverImage._id");  // we dont want password field

    // deleting old coverImage on cloudinary
    const oldCoverImageDeleted = await deleteOnCloudinary(oldCoverImagePublicId);
    
    if(!oldCoverImageDeleted) {
        throw new apiError(404, "Old CoverImage not deleted");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user, "CoverImage updated successfully."));

} );


export const getUserChannelProfile = asyncHandler( async(req, res) => {

    // Get "username or the channel we want" from the user through req.params
    const { username } = req.params;

    if(!username?.trim()) {
        throw new apiError(400, "Username is missing.");
    }

    // Writing the aggregation pipelines
    const channel = await User.aggregate([
        {   // first pipeline
            $match: {
                username: username?.toLowerCase()
            }
        },
        {   // second pipeline
            $lookup: {
                from: "subscriptions", // As "Subscription" model gets converted to "subscriptions" when stored in MongoDB
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {   // third pipeline
            $lookup: {
                from: "subscriptions", // As "Subscription" model gets converted to "subscriptions" when stored in MongoDB
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {   // fourth pipeline
            $addFields: {   // "addFields" is used to create fields that are not there but we create for our use
                subscribersCount: {
                    $size: "$subscribers" // we r getting the number of subs from the "as" field of "first pipeline". "$ sign" as it is a field now
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                },
            }
        },
        {   // fifth pipeline
            $project: { // "project" is used to give access only to the selected fields that we want
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new apiError(404, "Channel not available.");
    }

    // Returning the response
    return res
    .status(200)
    .json(new apiResponse(200, channel[0], "User channel fetched successfully."));  // [0] returning only the 1st object of "channel" for easy work of frontend engg.

} );


export const getWatchHistory = asyncHandler( async(req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id), // we need to manually create Mongoose object_id as in aggregate pipeline we directly connect with MongoDB whereas in only condition we connect througn Mongoose
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "userWatchHistory",
                pipeline: [ // nested or sub pipeline we r inside videos
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [ // nested or sub pipeline we r inside owner
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {   // as we will get an "owner array" after "lookup" from the above pipeline it is hard for frontend engg. So we created a pipeline addFields "owner" that contain the data of the 1st owner and we can easily take the data out.
                            owner: {
                                $first: "$owner"    // "$owner" as owner is a field now
                            }
                        }
                    }
                ]
            }
        }
    ]);

    // Returning Response
    return res
    .status(200)
    .json(new apiResponse(200, user[0].userWatchHistory, "watch history fetched successfully." ));

} );

