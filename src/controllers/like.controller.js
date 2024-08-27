import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js"
import { Comment } from "../models/Comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/apiResponse.js"
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";


const toggleVideoLike = asyncHandler(async(req, res)=>{
    const {videoId} =  req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const like = await Like.findOne({
        $and:{
            video: videoId,
            likedBy: req.user._id,
        }
    })
    if(!like){
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id ,
        })
        return res
        .status(200)
        .json(
            new ApiResponse(200, newLike, "successfully added new Like")
        )
    }else{
        console.log(like)
        await Like.findByIdAndDelete(like._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "successfully removed Like")
        )
    }
})

const toggleCommentLike = asyncHandler(async(req, res)=>{
    const {commentId} = req.params
    const comment = await Comment.findById(commentId)  
    if(!comment){
        throw new ApiError(404, "Comment not fond")
    }
    const like = await Like.findOne({
        $and:{
            likedBy: req.user._id,
            comment: commentId
        }
    })
    if(!like){
        const newLike = await Like.create({
            likedBy: req.user._id,
            comment: commentId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(200, newLike, "Successfully added Like")
        )
    }else{
        await Like.findByIdAndDelete(like._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "successfully removed Like")
        )
    }
})

const getLikedVideos = asyncHandler(async(req, res)=>{
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $match:{
                comment:undefined,
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
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
                                        _id:0,
                                        avatar:1,
                                        fullName:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            title:1,
                            thumbnail:1,
                            _id:0,
                            views:1,
                            duration:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                _id:0,
                video:1,
                updatedAt:1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "Successfully fetched Liked videos")
    )
})

export {toggleVideoLike, toggleCommentLike, getLikedVideos}