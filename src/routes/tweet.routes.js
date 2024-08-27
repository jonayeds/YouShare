import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets } from "../controllers/tweet.controller.js";

const router = Router()

router.route("/create-tweet").post(verifyJWT, createTweet)
router.route("/get-user-tweet").get(verifyJWT, getUserTweets)

export default router