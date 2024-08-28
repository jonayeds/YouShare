import { Comment } from "../models/Comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";


const createPlaylist = asyncHandler(async(req, res)=>{
    const {name, description} = req.body
    if(!name.trim()){
        throw new ApiError(400, "missing Playlist name")
    }
    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user._id 
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "successfully created playlist")
    )
})


const addVideoToPlaylist = asyncHandler(async(req, res)=>{
    const {videoId, playlistId} = req.params
})

export {addVideoToPlaylist, createPlaylist}