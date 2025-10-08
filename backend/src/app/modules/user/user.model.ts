import mongoose from "mongoose";
import { IUser } from "./user.interface";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema<IUser>(
  {
    fullname: { type: String, required: [true, "fullname is requried"] },
    email: {
      type: String,
      required: [true, "email is requried"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is requried"],
      minlength: [6, "minlength at lest list 6"],
    },
    bio: { type: String },
    profilePicture: { type: String },
    nativeLanguage: { type: String },
    learningLanguage: { type: String },
    location: { type: String },
    isOnboarded: { type: Boolean, default: false },
    friends: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
