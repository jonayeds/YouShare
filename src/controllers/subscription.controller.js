import { asyncHandler } from "../utils/asyncHandler.js";
import {Subscription} from "../models/subscription.model.js"
import mongoose from "mongoose";
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

export {toggleSubscription}