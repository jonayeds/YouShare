import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImageFromCloudinary, uploadOnCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js";

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
        duration:video.duration,
        owner: req.user._id
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

const getVideoById = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "invalid video Id")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video fetched successfully")
    )

})

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {title, description} = req.body

    const thumbnailLocalFilePath = req.file?.path
    const video = await Video.findById(videoId)
    if(video.owner.toString() !== req.user._id.toString()){
        console.log(req.user._id)
        console.log(video.owner)
        console.log(video.owner === req.user._id)
        throw new ApiError(400, "User is Unauthorized to update video")
    }
    let newThumbnail, oldThumbnail; 
    if(thumbnailLocalFilePath){
        newThumbnail =  await uploadOnCloudinary(thumbnailLocalFilePath)
        if(!newThumbnail?.url){
            throw new ApiError(500,"Error while uploading thumbnail to cloudinary")
        }
        await deleteImageFromCloudinary(video.thumbnail.split("/").pop().replace(".jpg", ""))
    }else{
       oldThumbnail = video.thumbnail
    }
   
    const newVideo =  await Video.findByIdAndUpdate(videoId, {
        $set:{
            thumbnail: newThumbnail?.url || oldThumbnail,
            title:title,
            description
        },
    }, 
    {new:true})
    return res
    .status(200)
    .json(
        new ApiResponse(200, newVideo, "Video updated successfully")
    )

    
})

const deleteVideo = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Invalid video id")
    }
    if(video.owner.toString() !== req.user._id.toString()){
        console.log(video.owner.toString())
        console.log(req.user._id.toString())
        throw new ApiError(400, "User is not Authorized to Delete the video")
    } 
    await deleteVideoFromCloudinary(video.videoFile.split("/").pop().replace(".mp4", ""))
    await Video.findByIdAndDelete(videoId)
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video Deleted successfully")
    )
})

export {getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo}