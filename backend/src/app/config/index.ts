import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT,
  mongo_url: process.env.MONGO_URL,
  stream_api_key: process.env.STREAM_API_KEY,
  stream_api_secret: process.env.STREAM_API_SECRET,
  jwt_secret: process.env.JWT_SECRET,
  node_env: process.env.NODE_ENV,
};
