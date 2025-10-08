// ব্যাকএন্ড সার্ভারের মূল ফাইল - এখানে সার্ভার চালু হয়
import mongoose from "mongoose";

import app from "./app";
import http from "http";
import socketServer from "./app/helper/socket";
import config from "./app/config";


// HTTP সার্ভার তৈরি করা হচ্ছে
const server = http.createServer(app);

// Socket.io সার্ভার চালু করা হচ্ছে
socketServer(server);

const port = config.port || 8080;

// মূল ফাংশন যা ডাটাবেস কানেক্ট করে এবং সার্ভার চালু করে
const main = async () => {
  try {
    // MongoDB ডাটাবেসের সাথে কানেক্ট করা হচ্ছে
    await mongoose.connect(config.mongo_url!);
    console.log("✅ Database connected successfully");

    // সার্ভার চালু করা হচ্ছে
    server.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
      console.log(`📡 Socket.io server is ready for connections`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// সার্ভার চালু করা
main();
