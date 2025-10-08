import config from "../../config";
import AppError from "../../error/appError";
import { IUser } from "../user/user.interface";
import User from "../user/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { upsertStreamUser } from "../../lib/stream";

const singUp = async (payload: Partial<IUser>) => {
  const user = await User.findOne({ email: payload.email });

  if (user) {
    throw new AppError(404, "User already exists");
  }

  const idx = Math.floor(Math.random() * 100) + 1;
  if (!payload.profilePicture) {
    payload.profilePicture = `https://avatar.iran.liara.run/public/${idx}.png`;
  }
  const result = await User.create(payload);

  try {
    await upsertStreamUser({
      id: result._id.toString(),
      name: result.fullname,
      image: result.profilePicture || "",
    });
    console.log("Stream user created successfully", result._id.toString());
  } catch (error) {
    throw new AppError(500, "Failed to create user in Stream");
  }

  const token = jwt.sign(
    { userId: result._id, name: result.fullname },
    config.jwt_secret!,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: result,
    token,
  };
};

const login = async (payload: { emain: string; password: string }) => {
  if (!payload.emain || !payload.password) {
    throw new AppError(400, "Invalid email or password");
  }
  const user = await User.findOne({ email: payload.emain }).select("+password");

  if (!user) {
    throw new AppError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid password");
  }
  const token = jwt.sign(
    { userId: user._id, name: user.fullname },
    config.jwt_secret!,
    { expiresIn: "7d" }
  );

  return {
    user,
    token,
  };
};


const profile = async (userId: string) => {
  const result = await User.findById(userId).select("-password");
  if (!result) throw new AppError(404, "User is not found");
  return result;
};

export const authService = {
  singUp,
  login,
  profile,
};
