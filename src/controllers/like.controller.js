import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
})

export const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

export const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

export const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

