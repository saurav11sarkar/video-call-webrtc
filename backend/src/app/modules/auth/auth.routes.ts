import express from "express";
import { authController } from "./auth.controller";
import protectedRoutes from "../../middleware/procetedRoutes";
const router = express.Router();

router.post("/singup", authController.singUp);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/onboarding", protectedRoutes, authController.onboarding);

router.get("/me", protectedRoutes, authController.profile);

export const authRouter = router;
