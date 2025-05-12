// Test script for TRPC connection
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./backend/trpc/app-router";
import superjson from "superjson";

// Create the test client
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      transformer: superjson,
    }),
  ],
});

// Test the connection with a simple query
async function testConnection() {
  try {
    console.log("Testing TRPC connection...");

    // Try to access a public route first - health check or similar
    // Using .mutate() instead of .query() since this is a mutation
    const result = await trpc.example.hi.mutate({ name: "Test" });
    console.log("Connection successful!", result);

    return result;
  } catch (error) {
    console.error("Connection failed:", error);
    return null;
  }
}

// Run the test
testConnection()
  .then((result) => {
    if (result) {
      console.log("TRPC connection test completed successfully!");
    } else {
      console.error("TRPC connection test failed.");
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Unexpected error during test:", err);
    process.exit(1);
  });
