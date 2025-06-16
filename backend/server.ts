import app from "./express";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file if it exists
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

// Start the server
try {
  const server = app.listen(PORT, () => {
    console.log("\n====================================");
    console.log(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`📚 API documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api`);
    console.log("====================================\n");
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Shutting down server...");
    server.close(() => {
      console.log("✅ Server shutdown complete");
      process.exit(0);
    });

    // Force close if it takes too long
    setTimeout(() => {
      console.error(
        "❌ Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}
