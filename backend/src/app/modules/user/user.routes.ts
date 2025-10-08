import express from "express";
import { userController } from "./user.controller";
import protectedRoutes from "../../middleware/procetedRoutes";
const router = express.Router();

router.use(protectedRoutes);

router.get("/", userController.getRecommendedUser);
router.get("/friend", userController.getRecommendedUser);

router.post("/friend-request/:id",userController.sendFriendRequest)

export const userRouter = router;
