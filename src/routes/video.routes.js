import {Router} from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, updateVideo } from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// general routes
router.route("/video/:videoId").get(getVideoById)

router.route("/").get(getAllVideos)

// secure routes

router.route("/upload-video").post(upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),
verifyJWT,
publishAVideo
)
router.route("/update/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo)

export default router