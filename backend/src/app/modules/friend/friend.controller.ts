import AppError from "../../error/appError";
import catchAsycn from "../../utils/catchAsycn";
import sendResponse from "../../utils/sendResponse";
import { friendService } from "./friend.service";

const sendRequestFriend = catchAsycn(async (req, res) => {
  const userId = req.user?._id.toString();

  const { id } = req.params;
  const result = await friendService.sendRequestFriend(userId!, id!);
  sendResponse(res, 201, "add friend added successfull", result);
});

export const friendController = {
  sendRequestFriend,
};
