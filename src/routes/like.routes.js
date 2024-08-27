import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getLikedVideos, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";
const router = Router()

// router.use(verifyJWT)
router.route("/toggleVideoLike/:videoId").post(verifyJWT,toggleVideoLike)
router.route("/toggleCommentLike/:videoId").post(verifyJWT, toggleCommentLike)
router.route("/liked-videos").get(verifyJWT, getLikedVideos)

export default router
