import express, { Router, Request, Response } from "express";
import receiptRoutes from "./receipt";
import paymentRoutes from "./payments";
import { authMiddleware } from "../middleware/auth";

const router: Router = express.Router();

// Health check route
router.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Budget Tracker API is running" });
});

// Mount routes with authentication
router.use("/receipts", authMiddleware, receiptRoutes);
router.use("/payments", authMiddleware, paymentRoutes);

export default router;
