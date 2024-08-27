import { asyncHandler } from "../utils/asyncHandler.js";
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"

const createTweet = asyncHandler(async(req, res)=>{
    const {content} = req.body
    if(!content){
        console.log(req.body)
        throw new ApiError(400, "Content needed to upload")
    }
    const tweet = await Tweet.create({
        content,
        owner:req.user._id
    })
    if(!tweet){
        throw new ApiError(500, "Error while uploading tweet on database")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async(req,res)=>{
    const tweets = await Tweet.find({owner: req.user._id})
    if(!tweets){
        console.log(tweets)
        throw new ApiError(404, "Tweets not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Fetched tweets successfully")
    )
})



export {createTweet, getUserTweets}