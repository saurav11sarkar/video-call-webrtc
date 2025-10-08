import AppError from "../../error/appError";
import { IUser } from "./user.interface";
import User from "./user.model";

const getRecommendedUser = async (userId: string, currentUser: IUser) => {
  const user = await User.findById(userId);
  if (user) {
    throw new AppError(404, "User is not found");
  }

  const recommendeUser = await User.find({
    $and: [
      { _id: { $ne: userId } },
      {
        id: { $nin: currentUser.friends },
      },
      {
        isOnboarded: true,
      },
    ],
  });
};
const getMyFriend = async (userId:string) => {
  const user = await User.findById(userId).select("friends").populate("friends","fullname profilePicture nativeLanguage learningLanguage location");
  if (user) {
    throw new AppError(404, "User is not found");
  }

  return user;
};

const sendFriendRequest = async () =>{

}

export const userService = {
  getRecommendedUser,
  getMyFriend,
  sendFriendRequest
};
