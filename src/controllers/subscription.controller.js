import { asyncHandler } from "../utils/asyncHandler.js";
import {Subscription} from "../models/subscription.model.js"
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";


const toggleSubscription = asyncHandler(async(req, res)=>{
    const {channelId} = req.params
    const channel = await User.findById(channelId)
    if(channelId === req.user._id.toString()){
        throw new ApiError(402, "Cannot Subscribe to Your own Account")
    }
    if(!channel){
        throw new ApiError(404, "channel not Found")
    }
    const subscription = await Subscription.findOneAndDelete({
        $and:{
            channel: channelId,
            subscriber: req.user._id
        }
    })
    if(!subscription){
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(200, newSubscription, "Subscription Added Successfully")
        )
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Subscription deleted successfully")
    )
})

const getUserChannelSubscribers = asyncHandler(async(req, res)=>{
    const { channelId } = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Invalid Channel id")
    }
    const subscribers = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscriberAccounts",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"subscriber",
                            foreignField:"_id",
                            as:"subscriber",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        _id:0,
                                        fullName:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            _id:0,
                            updatedAt:1,
                            subscriber:1
                        }
                    }
                   
                ]
            }
        },
        {
            $project:{
                subscriberAccounts: 1,
                _id:0
            }
        }
    ])
    if(!subscribers[0]){
        console.log(subscribers)
        throw new ApiError(404, "Channel not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers[0], "fetched subscribers successfully")
    )

})

const getSubscribedChannel = asyncHandler(async(req, res)=>{
    const {subscriberId} = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Channel Id")
    }
    const subscribedTo = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedChannels",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"channel",
                            foreignField:"_id",
                            as:"channel",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        _id:0,
                                        fullName:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            _id:0,
                            updatedAt:1,
                            channel:1
                        }
                    }
                   
                ]
            }
        },
        {
            $project:{
                subscribedChannels: 1,
                _id:0
            }
        }
    ])
    if(!subscribedTo[0]){
        throw new ApiError(404, "Channel not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedTo[0], "successfully fetched Subscribed channels")
    )
})

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannel}