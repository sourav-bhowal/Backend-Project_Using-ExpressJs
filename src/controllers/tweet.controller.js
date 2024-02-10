import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    // taking the inputs from the user
    const { content } = req.body;

    if (content === "") {
        throw new apiError(400, "Content is required.");
    }

    // creating a new tweet
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    });

    if (!tweet) {
        throw new apiError(400, "Something went wrong during tweet creation.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(201, tweet, "Tweet created successfully."));

});


export const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    // taking the userId from req.params
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id.");        
    }

    // checking for the user in DB
    const user = await User.findById(userId);

    if (!user) {
        throw new apiError(404, "User not found.");
    }

    // searching for tweets in the DB where userId is same as owner of tweet
    const tweets = await Tweet.aggregate([
        {
            $match: {   // returning only those tweets where owner & user._id are same
                owner: new mongoose.Types.ObjectId(user._id)
            }
        }
    ]);

    // if there are no tweets return response
    if (tweets.length === 0) {  // the type of tweets is object so we can check its length
        return res
        .status(404)
        .json(new apiResponse(404, tweets, "User has no tweets"));
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, tweets, "Tweets fetched successfully."))

});


export const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    // taking the content & tweetId from the user
    const { tweetId } = req.params;
    const { content } = req.body;

    if (content === "") {
        throw new apiError(404, "content is required.");
    }

    if (!isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweetId")
    }

    // searching for the tweet in the DB
    const updateTweet = await Tweet.findById(tweetId);

    if (!updateTweet) {
        throw new apiError(404, "Invalid tweetId.");
    }

    // updating the tweet if tweet owner & current user are same
    let updatedTweet;
    if (updateTweet.owner.toString() === req.user?._id.toString()) {
        updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {content}
        
            },
            {new: true}
        )
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, updatedTweet, "Tweet updated successfully."));

});


export const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    // taking the tweetId
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweetId")
    }

    // searching for the tweet in DB
    const deleteTweet = await Tweet.findById(tweetId);

    if (!deleteTweet) {
        throw new apiError(404, "Invalid tweetId.");
    }

    // deleting the tweet if looged in user is the tweet owner
    if (deleteTweet.owner.toString() === req.user?._id.toString()) {
        await Tweet.findByIdAndDelete(tweetId)
    } else {
        throw new apiError(404, "Unauthorized access.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet deleted successfully."));

});
