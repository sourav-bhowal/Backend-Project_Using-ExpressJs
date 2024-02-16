import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {User} from "../models/user.models.js"
import {Video} from "../models/video.models.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


export const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist

    // taking the name & description
    const {name, description} = req.body;
    
    if (name === "" && description === "") {
        throw new apiError(400, "Invalid name or description.")
    }

    // creating the playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    });

    if (!playlist) {
        throw new apiError(400, "Error while creating playlist");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist created successfully."))
  
} );


export const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists

    // taking the userId from req.params
    const {userId} = req.params
    
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id.");        
    }

    // checking for the user in DB
    const user = await User.findById(userId);

    if (!user) {
        throw new apiError(404, "User not found.");
    }

    // searching for playlists in the DB where userId is same as owner of tweet
    const playlists = await Playlist.aggregate([
        {
            $match: {   // returning only those tweets where owner & user._id are same
                owner: new mongoose.Types.ObjectId(user._id)
            }
        }
    ]);

    // if there are no playlists return response
    if (playlists.length === 0) {  // the type of tweets is object so we can check its length
        return res
        .status(404)
        .json(new apiResponse(400, playlists, "User has no playlists."));
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, playlists, "Playlists fetched successfully."));

} );


export const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id

    // get playlistId from user
    const {playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new apiError(404, "Invalid playlistId");
    }

    // searching for playlist in DB
    const searchedPlaylist = await Playlist.findById(playlistId);

    if (!searchedPlaylist) {
        throw new apiError(400, "Playlist not found.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, searchedPlaylist, "Playlist fetched successfully."));

} );


export const addVideoToPlaylist = asyncHandler(async (req, res) => {

    // taking playlist & video id's 
    const {playlistId, videoId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid playlistId");
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid videoId");
    }

    // searching for playlist & video in DB
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new apiError(400, "Playlist not found");
    }

    if (!video) {
        throw new apiError(400, "Video not found");
    }

    // adding video to playlist if the playlist owner is currently logged in
    let videoPlaylist;
    if (playlist.owner.toString() === req.user._id.toString()) {
        videoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
               $addToSet: {videos: video._id}   // pushing the video into the "videos" array of the playlist using "$addToSet method" as we want to push the video to the playlist only if it doesn't already exists in the playlist.
            },
            {new: true}
        )
    }else {
        throw new apiError(400, "Unauthorized access to playlist");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, videoPlaylist, "Video added to playlist successfully."))

} );


export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist

    // taking playlist & video id's 
    const {playlistId, videoId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid playlistId");
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid videoId");
    }

    // searching for playlist & video in DB
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new apiError(400, "Playlist not found");
    }

    if (!video) {
        throw new apiError(400, "Video not found");
    }

    // adding video to playlist if the playlist owner is currently logged in
    let videoPlaylist;
    if (playlist.owner.toString() === req.user._id.toString()) {
        videoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
               $pull: {videos: video._id}   // pushing the video into the "videos" array of the playlist
            },
            {new: true}
        )
    }else {
        throw new apiError(400, "Unauthorized access to playlist");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, videoPlaylist, "Video removed from playlist successfully."))


} );


export const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist

    // take the playlistId
    const {playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid PlaylistId.");
    }

    // searching for playlist in DB
    const deletePlaylist = await Playlist.findById(playlistId);

    if (!deletePlaylist) {
        throw new apiError(400, "Playlist not found.");
    }

    // delete the playlist if logged in user is playlist owner
    if (deletePlaylist.owner.toString() === req.user?._id.toString()) {
        await Playlist.findByIdAndDelete(playlistId)
    } else {
        throw new apiError(404, "Unauthorized access.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully."));
    
} );


export const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist

    // get the name, description, plylistID
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid PlaylistId.");
    }

    if (name === "" || description === "") {
        throw new apiError(400, "name or description must not be specified.")
    }

    // search for the playlist in the DB
    const updatePlaylist = await Playlist.findById(playlistId);

    if (!updatePlaylist) {
        throw new apiError(400, "Playlist not found.")
    }

    // update the playlist if logged in user is the playlist owner
    let updatedPlaylist;
    if (updatePlaylist.owner.toString() === req.user?._id.toString()) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                }
        
            },
            {new: true}
        )
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, updatedPlaylist, "Plsylist updated successfully."))
    
} );
