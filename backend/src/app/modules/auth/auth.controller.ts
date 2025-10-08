import config from "../../config";
import catchAsycn from "../../utils/catchAsycn";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";

const singUp = catchAsycn(async (req, res) => {
  const { email, password, fullname } = req.body;
  const result = await authService.singUp({ email, password, fullname });
  res.cookie("token", result.token, {
    httpOnly: true,
    secure: config.node_env === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: config.node_env === "production" ? "none" : "strict",
  });
  sendResponse(res, 201, "User created successfully", result.user);
});

const login = catchAsycn(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ emain: email, password });
  res.cookie("token", result.token, {
    httpOnly: true,
    secure: config.node_env === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: config.node_env === "production" ? "none" : "strict",
  });
  sendResponse(res, 200, "User logged in successfully", result.user);
});

const logout = catchAsycn(async (req, res) => {
  res.clearCookie("token");
  sendResponse(res, 200, "User logged out successfully", null);
});

const onboarding = catchAsycn(async (req, res) => {
  const userId = req.user?._id?.toString();

  if (!userId) {
    return sendResponse(res, 400, "User ID is missing or invalid", null);
  }
  const { fullname, nativeLanguage, bio, location, learningLanguage } =
    req.body;
  const result = await authService.onboarding(userId, {
    fullname,
    nativeLanguage,
    bio,
    location,
    learningLanguage,
  });
  sendResponse(res, 200, "User onboarding successfully", result);
});

const profile = catchAsycn(async (req, res) => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    return sendResponse(res, 400, "User ID is missing or invalid", null);
  }
  const result = await authService.profile(userId);

  sendResponse(res, 200, "My profile", result);
});

export const authController = {
  singUp,
  login,
  logout,
  onboarding,
  profile
};
