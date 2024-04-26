import mongoose, {isValidObjectId} from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

// controller to subscribe or unsubscribe a channel
export const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription

    // get channelId i.e. userId
    const {channelId} = req.params;

    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid Channel Id.")
    }

    // search for channel in DB
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new apiError(400, "Channel not found.");
    }

    if (channel._id.toString() === req.user?._id.toString()) {
        throw new apiError(400, "You cannot subscribe to your own channel.");
    }

    // check if channel is already subscribed if not already subscribed subscribe the channel
    const channelAlreadySubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channel._id
    });

    if (channelAlreadySubscribed) {
        await Subscription.findByIdAndDelete(channelAlreadySubscribed);

        return res
        .status(200)
        .json(new apiResponse(200, {}, "Channel unsubscribed successfully"));
    } 
    else {
        await Subscription.create({
            subscriber: req.user?._id,
            channel: channel._id
        })    
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Channel subscribed successfully"));


} );


// controller to return subscriber list of a channel
export const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    // take the channelId
    const {channelId} = req.params;

    if (!isValidObjectId(channelId)) {
        throw new apiError(404, "Invalid channel Id");
    }

    // search for channel in DB
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new apiError(404, "Channel not found");
    }

    // if channel is found fetch its subscribers
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $project: {
                subscriber: {
                    _id: 1,
                    username: 1,
                    email: 1
                }
            }
        }
    ]);

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, subscribers, "Subscribers fetched successfully."));


} );


// controller to return channel list to which user has subscribed
export const getSubscribedChannels = asyncHandler(async (req, res) => {

    // get the subscriber Id
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new apiError(404, "Invalid subscriber Id");
    }

    // search for channel in DB
    const subscriber = await User.findById(subscriberId);

    if (!subscriber) {
        throw new apiError(404, "Subscriber not found");
    }

    // if subscriber is found fetched the channels he has subscribed
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriber)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribedChannel"
            }
        },
        {
            $project: {
                subscribedChannel:{
                    _id: 1,
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage : 1,
                }
            }
        }
    ]);

    if (!subscribedChannels.length) {
        throw new apiError(404, "No channels subscribed");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, subscribedChannels, "Channels subscribed successfully fetched"));

} );

