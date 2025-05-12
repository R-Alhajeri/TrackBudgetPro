import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export type Receipt = {
  id: string;
  userId: string;
  date: string; // ISO string
  imageUrl: string;
  data: any; // extracted data (merchant, total, items, etc.)
};

// In-memory receipt store (replace with DB in production)
export const receipts: Receipt[] = [];

const receiptRoute = {
  list: protectedProcedure.query(({ ctx }) => {
    if (!ctx.userId) throw new Error("Not authenticated");
    return receipts.filter((r) => r.userId === ctx.userId);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const receipt = receipts.find(
        (r) => r.id === input.id && r.userId === ctx.userId
      );
      if (!receipt) throw new Error("Receipt not found");
      return receipt;
    }),

  upload: protectedProcedure
    .input(z.object({ imageUrl: z.string(), data: z.any() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const receipt: Receipt = {
        id: `receipt-${Date.now()}`,
        userId: ctx.userId as string,
        date: new Date().toISOString(),
        imageUrl: input.imageUrl,
        data: input.data,
      };
      receipts.push(receipt);
      return receipt;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const idx = receipts.findIndex(
        (r) => r.id === input.id && r.userId === ctx.userId
      );
      if (idx !== -1) receipts.splice(idx, 1);
      return { success: true };
    }),
};

export default receiptRoute;
