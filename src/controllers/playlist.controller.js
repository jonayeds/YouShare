import { Comment } from "../models/Comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
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

const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id")
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            _id:0,
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        _id:0,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    },
                    {
                        $project:{
                            thumbnail:1,
                            duration:1,
                            title:1,
                            owner:1
                        }
                    }
                ]
            }
        }
    ])
    if(!playlist[0]){
        throw new ApiError(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist[0] , "successfully fetched Playlist")
    )
})

const addVideoToPlaylist = asyncHandler(async(req, res)=>{
    const {videoId, playlistId} = req.params
    if(!(isValidObjectId(videoId) && 
        isValidObjectId(playlistId))){
            throw new ApiError(400, "Invalid VideoId or Playlist Id")
        }
    const newPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $push:{
            videos: videoId
        }
    })
    newPlaylist.videos = [...newPlaylist.videos, videoId] 
    return res
    .status(200)
    .json(
        new ApiResponse(200, newPlaylist, "successfully added Video to playlist")
    )
})

export {addVideoToPlaylist, createPlaylist, getPlaylistById}