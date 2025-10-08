import catchAsycn from "../../utils/catchAsycn";
import sendResponse from "../../utils/sendResponse";
import { IUser } from "./user.interface";
import { userService } from "./user.service";

const getRecommendedUser = catchAsycn(async (req, res) => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    return sendResponse(res, 400, "User ID is missing or invalid", null);
  }
  const currentUser = req.user as IUser;
  const result = await userService.getRecommendedUser(userId, currentUser);
  sendResponse(res, 200, "get all user retrive successfully", result);
});
const getMyFriend = catchAsycn(async (req, res) => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    return sendResponse(res, 400, "User ID is missing or invalid", null);
  }
  const result = await userService.getMyFriend(userId);
  sendResponse(res, 200, "get all user retrive successfully", result);
});

const sendFriendRequest = catchAsycn(async (req, res) => {});

export const userController = {
  getRecommendedUser,
  getMyFriend,
  sendFriendRequest,
};
