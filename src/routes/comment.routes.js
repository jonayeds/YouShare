import { Router } from "express";
import { addComment, getVideoComments } from "../controllers/comment.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()


router.use(verifyJWT)


router.route("/:videoId").post(addComment).get(getVideoComments)


export default router