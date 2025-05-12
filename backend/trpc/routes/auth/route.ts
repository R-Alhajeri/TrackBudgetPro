import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "@/backend/trpc/create-context";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "user" | "admin" | "guest";
  lastLogin?: string;
  expiresAt?: string;
  subscription?: {
    status: string;
    invoiceId?: string;
    lastUpdated?: string;
  };
};

// In-memory user store (replace with DB in production)
export const users: User[] = [
  {
    id: "admin-1",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", 10),
    name: "Admin",
    role: "admin",
  },
  {
    id: "user-1",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", 10),
    name: "User",
    role: "user",
  },
];

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const authRoute = {
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(({ input }) => {
      if (users.find((u) => u.email === input.email)) {
        throw new Error("Email already registered");
      }
      const id = `user-${Date.now()}`;
      const hashed = bcrypt.hashSync(input.password, 10);
      users.push({
        id,
        email: input.email,
        password: hashed,
        name: input.name,
        role: "user",
      });
      return { success: true };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(({ input }) => {
      const user = users.find((u) => u.email === input.email);
      if (!user || !bcrypt.compareSync(input.password, user.password)) {
        throw new Error("Invalid credentials");
      }
      user.lastLogin = new Date().toISOString();
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      };
    }),

  me: protectedProcedure.query(({ ctx }) => {
    const user = users.find((u) => u.id === ctx.userId);
    if (!user) throw new Error("User not found");
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin,
    };
  }),

  list: adminProcedure.query(() => users.map(({ password, ...u }) => u)),

  createGuest: publicProcedure.mutation(() => {
    // Generate a unique guest id and email
    const id = `guest-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const email = `${id}@guest.local`;
    const name = "Guest";
    const role: "guest" = "guest";
    // Set expiration for 48 hours from now
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const user: User = { id, email, password: "", name, role, expiresAt };
    users.push(user);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "2d",
    });
    // Add guest usage limits to response
    const guestLimits = { maxTransactions: 20, maxCategories: 5 };
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        expiresAt: user.expiresAt,
      },
      guestLimits,
    };
  }),
};

export default authRoute;
