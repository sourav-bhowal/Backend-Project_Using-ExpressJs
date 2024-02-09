import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

export const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

