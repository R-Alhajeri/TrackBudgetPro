import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export type Category = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
};

// In-memory category store (replace with DB in production)
export const categories: Category[] = [];

// Guest/demo mode limits
const MAX_GUEST_CATEGORIES = 5;

const categoryRoute = {
  list: protectedProcedure.query(({ ctx }) => {
    if (!ctx.userId) throw new Error("Not authenticated");
    return categories.filter((c) => c.userId === ctx.userId);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string(), color: z.string(), icon: z.string() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      // Enforce guest/demo mode category limit
      if (ctx.userRole === "guest") {
        const guestCatCount = categories.filter(
          (c) => c.userId === ctx.userId
        ).length;
        if (guestCatCount >= MAX_GUEST_CATEGORIES) {
          throw new Error(
            JSON.stringify({
              code: "GUEST_LIMIT_REACHED",
              message:
                "Guest users can only add up to 5 categories. Upgrade to unlock more!",
            })
          );
        }
      }
      const category: Category = {
        id: `cat-${Date.now()}`,
        userId: ctx.userId as string,
        name: input.name,
        color: input.color,
        icon: input.icon,
      };
      categories.push(category);
      return category;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        icon: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const category = categories.find(
        (c) => c.id === input.id && c.userId === ctx.userId
      );
      if (!category) throw new Error("Category not found");
      category.name = input.name;
      category.color = input.color;
      category.icon = input.icon;
      return category;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const idx = categories.findIndex(
        (c) => c.id === input.id && c.userId === ctx.userId
      );
      if (idx !== -1) categories.splice(idx, 1);
      return { success: true };
    }),
};

export default categoryRoute;
