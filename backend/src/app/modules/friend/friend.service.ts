import AppError from "../../error/appError";
import User from "../user/user.model";
import Friend from "./friend.model";

const sendRequestFriend = async (userId: string, id: string) => {
  if (userId === id) {
    throw new AppError(400, "You can't send friens request to user");
  }
  const recipient = await User.findById(id);
  if (!recipient) throw new AppError(404, "Recipient is not fount");

  if (recipient.friends?.includes(userId as any))
    throw new AppError(400, "You are already friend with this user");

  const existingRequest = await Friend.findOne({
    $or: [
      { sender: userId, recipient: id },
      { sender: id, recipient: recipient },
    ],
  });

  if (existingRequest)
    throw new AppError(400, "A friend request exits between you and this user");

  const friendRequest = await Friend.create({
    sender: userId,
    recipient: recipient,
  });

  return friendRequest;
};


const acceptFriendRequest = async(id:string) =>{
    const friend = await Friend.findById(id);
    
}

export const friendService = {
  sendRequestFriend,
};
