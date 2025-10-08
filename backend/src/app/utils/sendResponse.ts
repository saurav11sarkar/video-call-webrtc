import { Response } from "express";

const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export default sendResponse;
