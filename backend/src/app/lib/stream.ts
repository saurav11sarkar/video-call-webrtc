import { StreamChat, User } from "stream-chat";
import config from "../config";
import AppError from "../error/appError";

const apiKey = config.stream_api_key;
const apiSecret = config.stream_api_secret;

if (!apiKey || !apiSecret) {
  throw new AppError(401, "Stream API key and secret are required");
}

// ✅ Single instance of Stream client
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

/**
 * Create or update a user in Stream
 */
export const upsertStreamUser = async (userData: User) => {
  try {
    await streamClient.upsertUser(userData);
    return userData;
  } catch (error: any) {
    console.error("Stream upsertUser error:", error.message || error);
    throw new AppError(500, "Failed to upsert Stream user");
  }
};

/**
 * Generate a Stream chat token for a given user
 */
export const generateStreamToken = (userId: string) => {
  try {
    return streamClient.createToken(userId);
  } catch (error: any) {
    console.error("Stream createToken error:", error.message || error);
    throw new AppError(500, "Failed to generate Stream token");
  }
};
