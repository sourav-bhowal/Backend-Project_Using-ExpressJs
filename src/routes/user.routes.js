import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Route for user registration
userRouter.route("/register").post(
    // using middleware in between for uploading images and avatar
    upload.fields([
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
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-user-details").patch(verifyJWT, updateUserDetails);

export default userRouter;