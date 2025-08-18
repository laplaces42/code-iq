import express from "express";
const router = express.Router();
import authController from "../controllers/authController.js";
const { callback, verifyJwt, refreshAccessToken, fetchUser, logout } =
  authController;

router.post("/callback", callback);
router.get("/verify", verifyJwt);
router.post("/refresh", refreshAccessToken);
router.post("/fetch-user", fetchUser);
router.post("/logout", logout);

export default router;
