import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.route("/create-tweet").post(verifyJWT, createTweet)
router.route("/get-user-tweet").get(verifyJWT, getUserTweets)
router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet)

export default router