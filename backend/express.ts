import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import router from "./api/routes";
import { initializeFirebase } from "../lib/firebase";

// Initialize Firebase
initializeFirebase({
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
}).catch((err) => {
  console.error("Failed to initialize Firebase:", err);
});

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api", router);

// API Documentation route (placeholder for future Swagger/OpenAPI implementation)
app.get("/api-docs", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "API Documentation - To be implemented with Swagger/OpenAPI",
    endpoints: [
      { method: "GET", path: "/api", description: "API health check" },
      {
        method: "POST",
        path: "/api/receipts/process",
        description: "Process receipt image",
      },
      {
        method: "POST",
        path: "/api/payments/validate",
        description: "Validate in-app purchase receipt",
      },
      {
        method: "GET",
        path: "/api/payments/subscription-status",
        description: "Get subscription status",
      },
    ],
  });
});

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Budget Tracker API is running" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

export default app;
