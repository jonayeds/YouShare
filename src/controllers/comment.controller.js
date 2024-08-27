import { Comment } from "../models/Comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/apiResponse.js"

const getVideoComments = asyncHandler(async(req, res)=>{

})

const addComment = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content missing to upload")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not Found")
    }
    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Successfully uploaded comment")
    )

})

export {getVideoComments, addComment}