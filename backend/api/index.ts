import express, { Router, Request, Response } from "express";
import receiptRoutes from "./routes/receipt";
import paymentRoutes from "./routes/payments";
import { authMiddleware } from "./middleware/auth";

// Create the main API router
const router: Router = express.Router();

// Health check endpoint
router.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Budget Tracker API is running" });
});

// Apply the auth middleware to protected routes
router.use("/receipts", authMiddleware, receiptRoutes);
router.use("/payments", authMiddleware, paymentRoutes);

// Add more routes as needed
// Example: router.use("/users", authMiddleware, userRoutes);

export default router;
