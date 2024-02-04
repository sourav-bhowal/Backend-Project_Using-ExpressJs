import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshTokens.js";
import jwt from "jsonwebtoken";


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
        avatar: [avatar.url, avatar.public_id], // storing only avatar url, public_id on the DB. URL, public_id is coming from cloudinary
        coverImage: [coverImage?.url, coverImage?.public_id] || "", // "?" as their might not be a cover image always
        email,
        password,
        username: username.toLowerCase()
    });


    // Check for newly created user
    const createdUser = await User.findById(user._id).select( 
        // by default all fields are selected in "select" so "minus sign" is used to exclude the fields we dont want to select
        "-password -refreshToken"   
    );

    if(!createdUser){
        throw new apiError(500, "user registration error.");
    }

    
    // Returning the Response
    return res
    .status(201)
    .json(
        new apiResponse(200, createdUser, "user registered successfully")
    )
   
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
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
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
            $unset: { refreshToken: 1 }
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
    ).select("-password") // we don't want password field


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

    if(!newAvatar.url) { // we only need the new avatar url not whole object
        throw new apiError(404, "Avatar file not found");
    }

    // storing old avatar public_id from DB in a variable
    const oldAvatarPublicId = req.user?.avatar[1]; // [1] as public_id is stored in the 2nd block of the avatar array

    // finding & updating the user on the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {avatar: [newAvatar.url, newAvatar.public_id]}  // we only need the new avatar url not whole object
        },
        {new: true}
    ).select("-password");  // we dont want password field
    
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

    if(!newCoverImage.url) { // we only need the new cover image url not whole object
        throw new apiError(404, "Cover Image file not found");
    }

    // storing old coverImage public_id from DB in a variable
    const oldCoverImagePublicId = req.user?.coverImage[1]; // [1] as public_id is stored in the 2nd block of the coverImage array

    // Finding & updating the user on the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {coverImage: newCoverImage.url}  // we only need the new cover image url not whole object
        },
        {new: true}
    ).select("-password");  // we dont want password field

    // deleting old avatar on cloudinary
    const oldCoverImageDeleted = await deleteOnCloudinary(oldCoverImagePublicId);
    
    if(!oldCoverImageDeleted) {
        throw new apiError(404, "Old CoverImage not deleted");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user, "CoverImage updated successfully."));

} );


