import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import useAuthStore from "@/store/auth-store";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW =
  process.env.NODE_ENV === "production" ? 500 : 200; // 500 for production, 200 for dev
const RATE_LIMIT_COOLDOWN = 5 * 1000; // 5 seconds cooldown after hitting limit

// Simple in-memory rate limiter
// In production, use a distributed rate limiter like Redis
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Get client IP for rate limiting
  const clientIp =
    opts.req.headers.get("x-forwarded-for") ||
    opts.req.headers.get("x-real-ip") ||
    "unknown";

  // Apply rate limiting
  const now = Date.now();
  let rateLimit = rateLimiter.get(clientIp);

  if (!rateLimit || now > rateLimit.resetAt) {
    // Reset rate limit if window has expired
    rateLimit = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    rateLimiter.set(clientIp, rateLimit);
  } else {
    // Increment request count
    rateLimit.count += 1;

    // Check if rate limit exceeded
    if (rateLimit.count > MAX_REQUESTS_PER_WINDOW) {
      // If still within cooldown, block immediately
      if (now < rateLimit.resetAt + RATE_LIMIT_COOLDOWN) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please wait a few seconds.",
        });
      }
      // Otherwise, start cooldown
      rateLimit.resetAt = now + RATE_LIMIT_COOLDOWN;
      rateLimiter.set(clientIp, rateLimit);
      console.warn(
        `[RateLimit] IP: ${clientIp} exceeded limit (${rateLimit.count} in ${
          RATE_LIMIT_WINDOW / 1000
        }s) at ${new Date().toISOString()}`
      );
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please wait a few seconds.",
      });
    }
  }

  // Get auth info from request headers
  const authHeader = opts.req.headers.get("authorization");
  let userId: string | null = null;
  let userRole: string | null = null;

  // Use real JWT verification
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const { verifyJwt } = await import("@/backend/utils/auth");
      const payload = verifyJwt(token);
      if (payload) {
        userId = payload.id;
        userRole = payload.role;
      } else {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid authentication token",
        });
      }
    } catch (error) {
      console.error("Error parsing auth token:", error);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication failed",
      });
    }
  }

  return {
    req: opts.req,
    userId,
    userRole,
    isAuthenticated: !!userId,
    clientIp, // Add client IP to context for additional security checks
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Don't expose stack traces in production
        stack:
          process.env.NODE_ENV === "development" ? shape.data.stack : undefined,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      // Add user info to context
      userId: ctx.userId,
      userRole: ctx.userRole,
    },
  });
});

// Admin-only procedure
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  if (ctx.userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      userRole: ctx.userRole,
    },
  });
});
