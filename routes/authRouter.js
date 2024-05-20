import express from "express";

import validateBody from "../helpers/validateBody.js";
import {
  registerSchema,
  loginSchema,
  updateSubscriptionSchema,
} from "../schemas/usersSchema.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  updateSubscription,
} from "../controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";

const authRouter = express.Router();
authRouter.post("/register", validateBody(registerSchema), registerUser);

authRouter.post("/login", validateBody(loginSchema), loginUser);

authRouter.post("/logout", authenticate, logoutUser);

authRouter.get("/current", authenticate, currentUser);

authRouter.patch(
  "/",
  authenticate,
  validateBody(updateSubscriptionSchema),
  updateSubscription
);

export default authRouter;
