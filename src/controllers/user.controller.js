import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  if (
    [fullName, email, username, password].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }
  console.log(req.files);
  //  const avatarLocalPath = req.files?.avatar[0]?.path
  let coverImageLocalPath, avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(409, "Avatar is needed");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // to-dos
  // take inputs from user : username, password,
  // find user with same username  from database
  // check password
  // access and refresh token
  // send cookie
  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "user does not exist!!");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
//   console.log(isPasswordValid)
  if (!isPasswordValid) {
    console.log(user)
    throw new ApiError(401, "Wrong password!!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out"));
});

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshAccessToken || req.body.refreshAccessToken
    if(!incomingRefreshToken){
        throw new ApiError( 401 , "Unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError( 401 , "Invalid Refresh token");
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }
        const options = {
            httpOnly:true,
            secure:true,
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
    
})

const changeCurrentPassword = asyncHandler( async(req ,res)=>{
  const {oldPassword, newPassword} = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Old Password");
  }
  user.password = newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=>{
  return res
  .status(200)
  .json(
    200,
    req.user,
    "User fetched successfully"
  )
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
  const {fullName, email} = req.body
  if(!(fullName|| email)){
    throw new ApiError(400, "All fields are required")
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set:{
      fullName,
      email
    }
  }, {new:true}).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    user,
    "Account updated successfully"
  ))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(500,"Error while uploading avatar");
  }
const oldURL =req.user?.avatar
const publicId = oldURL.split("/").pop().replace(".jpg", "")
const deleted = await deleteImageFromCloudinary(publicId)
console.log(deleted)
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set:{
      avatar: avatar.url,
    },    
  },
  {new:true}
).select("-password")

return res
.status(200)
.json(
  new ApiResponse(200,
    user,
    "Avatar updated successfully"
  )
)
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(500,"Error while uploading Cover Image");
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set:{
      coverImage: coverImage.url,
    },    
  },
  {new:true}
).select("-password")
return res
.status(200)
.json(
  new ApiResponse(200,
    user,
    "Cover Image updated successfully"
  )
)
})

const getUSerChannelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params
  if(!username?.trim()){
    throw new ApiError(400,"username id missing");
  }
  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount: {
          $size:"$subscribers",
        },
        channelsSubscribedToCount:{
          $size:"$subscribeTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in: [req.user?._id, "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1,
      }
    }
  ])
  if(!channel?.length){
    throw new ApiError(404,"channel does not exist");
  }
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      channel[0],
      "User channel fetched successfully"
    )
  )
})

const getWatchHistory = asyncHandler(async(req, res)=>{
  const user  = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
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
                    userName:1,
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
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "User watch history fetched successfully" )
  )
})

export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUSerChannelProfile, getWatchHistory };
