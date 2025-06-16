import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get the authorization header
  const authHeader = req.headers.authorization;

  // Check if the header exists and has the correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Missing or invalid authorization header",
    });
    return;
  }

  // Extract the token
  const token = authHeader.substring(7);

  try {
    // In a real app, you would verify the token here
    // For demo purposes, we'll just check if it's not empty
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
      return;
    }

    // Add the user info to the request object
    // In a real app, you would decode the token and get the user ID
    (req as any).userId = "user-123";

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized: Authentication failed",
    });
  }
};
