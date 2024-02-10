import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { Video } from "../models/video.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

} );


export const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    // taking the comment content & video id
    const { videoId } = req.params;
    const { content } = req.body;

    if (content === "") {
        throw new apiError(400, "Content is required.");
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid videoId");
    }

    // search for video in DB
    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(400, "Video not found");
    }

    // create a new comment
    const comment = await Comment.create({
        content,
        video: video._id,
        owner: req.user?._id
    });

    if (!comment) {
        throw new apiError(400, "Error creating comment.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment created successfully."));

} );


export const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    // taking content from the body
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (content === "") {
        throw new apiError(400, "Content is required");
    }

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid commentId");
    }

    // searching for the comment in DB
    const updateComment = await Comment.findById(commentId);

    if (!updateComment) {
        throw new apiError(400, "Comment not found")
    }

    // updating a comment if comment owner & logged in user are same
    let updatedComment;
    if (updateComment.owner.toString() === req.user?._id.toString()) {
        updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {content}
        
            },
            {new: true}
        )
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, updatedComment, "Comment updated successfully."));

} );


export const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    // taking the commentId
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid commentId")
    }

    // searching for the comment to delete from DB
    const deleteComment = await Comment.findById(commentId);

    if (!deleteComment) {
        throw new apiError(404, "Invalid CommentId.");
    }

    // delete the comment if comment owener is the cureent logged in user
    if (deleteComment.owner.toString() === req.user?._id.toString()) {
        await Comment.findByIdAndDelete(commentId)
    } else {
        throw new apiError(404, "Unauthorized access.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully."));
} );

