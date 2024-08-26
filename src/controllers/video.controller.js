import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import {Video} from "../models/video.model.js"
import { ApiResponse } from "../utils/apiResponse.js";

const getAllVideos = asyncHandler(async(req, res)=>{

})

const publishAVideo  = asyncHandler(async(req, res)=>{
    const {title, description} = req.body
    if(!(title || description)){
        throw new ApiError(400, "Title and Description required")
    }
    let videoLocalFilePath, thumbnailLocalFilePath
    if(req.files &&
        Array.isArray(req.files.videoFile) &&
        req.files.videoFile.length >0
    ){
        videoLocalFilePath = req.files.videoFile[0].path
    }
    if(req.files &&
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length >0
    ){
        thumbnailLocalFilePath = req.files.thumbnail[0].path
    }
    if(!(videoLocalFilePath || thumbnailLocalFilePath)){
        throw new ApiError(200, "Video file and Thumbnail required")
    }
    const video = await uploadOnCloudinary(videoLocalFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath)
    console.log(video)
    if(!(video || thumbnail)){
        throw new ApiError(500, "Error while uploading file on cloudinary");
    }
    const createVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        duration:video.duration
    })

    const createdVideo = await Video.findById(createVideo._id)
    if(!createdVideo){
        throw new ApiError(500,"Something went wrong while registering Video");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, createdVideo, "Video registered successfully")
    )


})

export {getAllVideos, publishAVideo}