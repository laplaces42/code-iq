import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
import authRoutes from "./routes/authRoutes.js";
import repoRoutes from "./routes/repoRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";

const requiredEnvVars = [
  "DB_URL",
  "DB_KEY",
  "JWT_SIGNING_KEY",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "WORKSPACE_DIR",
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ Required environment variable ${varName} is missing`);
    process.exit(1);
  }
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Middleware to parse URL-encoded bodies
app.use(cookieParser()); // Middleware to parse cookies
app.use("/auth", authRoutes);
app.use("/repos", repoRoutes);
app.use("/scan", scanRoutes);

// Add to server.js (after all routes)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    code: "NOT_FOUND",
  });
});

// Add to server.js
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  // Don't crash, just log
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // This one should exit
});

app.listen(3001);
