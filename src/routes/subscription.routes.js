import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route('/toggle-subscription/:channelId').post(verifyJWT, toggleSubscription)
router.route("/get-subscribers/:channelId").get(getUserChannelSubscribers)

export default router