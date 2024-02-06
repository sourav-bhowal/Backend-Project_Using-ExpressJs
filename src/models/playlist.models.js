import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    videos: [   // videos will be an array as there will be multiple videos in a playlist
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true});


export const Playlist = mongoose.model("Playlist", playlistSchema);