import { ObjectId } from "mongoose";

export interface IUser {
  _id:ObjectId;
  fullname: string;
  email: string;
  password: string;
  bio?: string;
  profilePicture?: string;
  nativeLanguage?: string;
  learningLanguage?: string;
  location?: string;
  isOnboarded?: boolean;
  friends?: ObjectId[];
}
