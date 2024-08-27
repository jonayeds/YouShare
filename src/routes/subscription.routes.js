import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannel, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route('/toggle-subscription/:channelId').post(verifyJWT, toggleSubscription)
router.route("/get-subscribers/:channelId").get(getUserChannelSubscribers)
router.route("/get-subscribed-channels/:subscriberId").get(getSubscribedChannel)
export default router