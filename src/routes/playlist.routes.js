import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addVideoToPlaylist, createPlaylist } from "../controllers/playlist.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist)
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)

export default router