import { Comment } from "../models/Comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const {videoId} = req.params
  const {page=0, limit=10, sortBy="createdAt", sortType="recent"}=  req.query
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video Id")
  }
  const comments = await Comment.aggregate([
    {
      $match:{
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"s",
        pipeline:[
          {
            $project:{
              avatar:1,
              fullName:1
            }
          }
        ]
      }
    }
  ]).sort(`${sortType !== "recent" ? "" : "-"}${sortBy}`).skip(parseInt(page)* parseInt(limit)).limit(parseInt(limit))

  return res
  .status(200)
  .json(
    new ApiResponse(200, comments, "Successfully fetched Video comments")
  )
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content missing to upload");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not Found");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Successfully uploaded comment"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;
  if (!content) {
    throw new ApiError(400, "Content missing to upload");
  }
  const comment = await Comment.findById(commentId);
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "User not Authorized to update Comment");
  }
  const newComment = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      content,
    },
  });
  if (!newComment) {
    throw new ApiError(404, "Comment Not found");
  }
  newComment.content = content;
  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "successfully updated comment"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              owner: 1,
              _id: 0,
            },
          },
        ],
      },
    },
  ]);
  
 
  if (
   !(( comment[0]?.owner?.toString() === req.user._id.toString()) ||
    (comment[0]?.video[0]?.owner?.toString() === req.user._id.toString()))
  ) {
      throw new ApiError(404, "User not Authorized to Delete comment");
}
if (!comment.length) {
    throw new ApiError(404, "Comment Not found");
  }
  await Comment.findByIdAndDelete(commentId)
  return res
  .status(200)
  .json(
    new ApiResponse(200, comment, "successfully Deleted Comment ")
  )
  
});

export { getVideoComments, addComment, updateComment, deleteComment };
