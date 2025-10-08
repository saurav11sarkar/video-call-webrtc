import mongoose from "mongoose";
import { IFriend } from "./friend.interface";

const friendSchema = new mongoose.Schema<IFriend>(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      requried: true,
    },
    status: {
      type: String,
      enum: ["pending", "acceptes"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Friend = mongoose.model<IFriend>("Friend", friendSchema);
export default Friend;
