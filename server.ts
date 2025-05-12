import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./backend/trpc/app-router";
import { createContext } from "./backend/trpc/create-context";
import { cleanupExpiredGuests } from './backend/trpc/routes/auth/route';

// Create a Hono app
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Create the main server app
const serverApp = new Hono();

// Mount the API routes at /api
serverApp.route("/api", app);

// Fallback route for API root
serverApp.get("*", (c) => {
  return c.json({
    status: "ok",
    message: "Elegant Budget Tracker API",
    endpoints: {
      api: "/api",
      trpc: "/api/trpc",
      health: "/api",
    },
  });
});

// Periodically clean up expired guest/demo users and their data every hour
setInterval(() => {
  try {
    cleanupExpiredGuests();
    console.log('[Guest Cleanup] Expired guest users and data cleaned up.');
  } catch (err) {
    console.error('[Guest Cleanup] Error during cleanup:', err);
  }
}, 1000 * 60 * 60); // Every hour

// Start the server
const PORT = process.env.PORT || 3000;
console.log(`Starting server on port ${PORT}...`);

serve({
  fetch: serverApp.fetch,
  port: Number(PORT),
});

console.log(`Server running at http://localhost:${PORT}`);
