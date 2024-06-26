import express from "express";

import validateBody from "../helpers/validateBody.js";
import {
  registerSchema,
  loginSchema,
  updateSubscriptionSchema,
  verifySchema,
} from "../schemas/usersSchema.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  verifyUser,
  updateSubscription,
  updateAvatar,
  resendVerifyEmail,
} from "../controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const authRouter = express.Router();
authRouter.post("/register", validateBody(registerSchema), registerUser);

authRouter.post("/login", validateBody(loginSchema), loginUser);

authRouter.post("/logout", authenticate, logoutUser);

authRouter.get("/current", authenticate, currentUser);

authRouter.get("/verify/:verificationToken", verifyUser);

authRouter.post("/verify", validateBody(verifySchema), resendVerifyEmail);

authRouter.patch(
  "/",
  authenticate,
  validateBody(updateSubscriptionSchema),
  updateSubscription
);

authRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  updateAvatar
);

export default authRouter;
