import express from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { userRouter } from "../modules/user/user.routes";
const router = express.Router();

const allRouters = [
  { path: "/auth", route: authRouter },
  { path: "/user", route: userRouter },
];

allRouters.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
