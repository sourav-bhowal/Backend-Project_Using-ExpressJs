import { Router } from 'express';
import {getLikedVideos,toggleCommentLike,toggleVideoLike,toggleTweetLike} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const likeRouter = Router();
likeRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

likeRouter.route("/toggle/v/:videoId").post(toggleVideoLike);
likeRouter.route("/toggle/c/:commentId").post(toggleCommentLike);
likeRouter.route("/toggle/t/:tweetId").post(toggleTweetLike);
likeRouter.route("/videos").get(getLikedVideos);

export default likeRouter