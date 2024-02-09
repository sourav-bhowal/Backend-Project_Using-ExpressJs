import mongoose, {isValidObjectId} from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


export const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
export const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

