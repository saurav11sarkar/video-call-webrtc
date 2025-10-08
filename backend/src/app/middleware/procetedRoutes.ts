import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../error/appError";
import config from "../config";
import User from "../modules/user/user.model";
import { IUser } from "../modules/user/user.interface";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Define custom token payload type
interface TokenPayload extends JwtPayload {
  userId: string;
}

const protectedRoutes = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // const token = req.headers.authorization?.split(" ")[1];
    const token = req.cookies?.token;
    if (!token) {
      throw new AppError(401, "You are not authorized");
    }

    const decoded = jwt.verify(token, config.jwt_secret!) as TokenPayload;
    if (!decoded?.userId) {
      throw new AppError(401, "Invalid token payload");
    }

    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) {
      throw new AppError(404, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default protectedRoutes;
