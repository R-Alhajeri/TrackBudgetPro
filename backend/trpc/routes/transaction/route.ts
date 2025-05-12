import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export type Transaction = {
  id: string;
  userId: string;
  year: number;
  month: number;
  date: string; // ISO string
  amount: number;
  categoryId: string;
  note?: string;
  receiptId?: string;
};

// In-memory transaction store (replace with DB in production)
export const transactions: Transaction[] = [];

// Guest/demo mode limits
const MAX_GUEST_TRANSACTIONS = 20;

const transactionRoute = {
  list: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      return transactions.filter(
        (t) =>
          t.userId === ctx.userId &&
          t.year === input.year &&
          t.month === input.month
      );
    }),

  create: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(),
        date: z.string(),
        amount: z.number(),
        categoryId: z.string(),
        note: z.string().optional(),
        receiptId: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      // Enforce guest/demo mode transaction limit
      if (ctx.userRole === "guest") {
        const guestTxCount = transactions.filter(
          (t) => t.userId === ctx.userId
        ).length;
        if (guestTxCount >= MAX_GUEST_TRANSACTIONS) {
          throw new Error(
            JSON.stringify({
              code: "GUEST_LIMIT_REACHED",
              message:
                "Guest users can only add up to 20 transactions. Upgrade to unlock more!",
            })
          );
        }
      }
      const transaction: Transaction = {
        id: `txn-${Date.now()}`,
        userId: ctx.userId as string,
        year: input.year,
        month: input.month,
        date: input.date,
        amount: input.amount,
        categoryId: input.categoryId,
        note: input.note,
        receiptId: input.receiptId,
      };
      transactions.push(transaction);
      return transaction;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
        amount: z.number(),
        categoryId: z.string(),
        note: z.string().optional(),
        receiptId: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const txn = transactions.find(
        (t) => t.id === input.id && t.userId === ctx.userId
      );
      if (!txn) throw new Error("Transaction not found");
      txn.date = input.date;
      txn.amount = input.amount;
      txn.categoryId = input.categoryId;
      txn.note = input.note;
      txn.receiptId = input.receiptId;
      return txn;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const idx = transactions.findIndex(
        (t) => t.id === input.id && t.userId === ctx.userId
      );
      if (idx !== -1) transactions.splice(idx, 1);
      return { success: true };
    }),
};

export default transactionRoute;
