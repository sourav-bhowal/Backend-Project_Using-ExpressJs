import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

export const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

export const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

export const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})