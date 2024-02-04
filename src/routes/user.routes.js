import { Router } from "express";
import { 
    changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, 
    loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, 
    updateUserDetails 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Route for user registration
userRouter.route("/register").post(
    // using middleware in between for uploading images and avatar
    upload.fields([ // we have to write like this "name" as we are uploading multiple fields at same time
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 2
        }
    ]),
    registerUser
);

// Route for login user
userRouter.route("/login").post(loginUser);
// Route for logout user
userRouter.route("/logout").post(verifyJWT, logoutUser);
// Route for refresh token
userRouter.route("/refresh-token").post(refreshAccessToken);
// Route for current user
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);   // we r verifying JWT as we dont want to send new data or files if no user is logged in.
// Route for change password
userRouter.route("/change-password").patch(verifyJWT, changeCurrentUserPassword);
// Route for update account details
userRouter.route("/update-user-details").patch(verifyJWT, updateUserDetails);   // "patch" is used instead of "post" as "post" will update all details
// Route for update avatar
userRouter.route("/update-user-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);    // we r using "single" as we r uploading a single file 
// Route for update coverImage
userRouter.route("/update-user-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
// Route for get channel profile
userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile);   // as it is taking params we have to write "/channel/:username" its mandatory
// Route for get user watchHistory
userRouter.route("/watchHistory").get(verifyJWT, getWatchHistory);


export default userRouter;