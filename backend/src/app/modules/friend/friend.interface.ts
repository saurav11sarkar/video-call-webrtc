import { ObjectId } from "mongoose";

export interface IFriend {
  sender: ObjectId;
  recipient: ObjectId;
  status: "pending" | "acceptes";
}
