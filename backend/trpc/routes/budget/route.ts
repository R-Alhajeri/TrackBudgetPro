import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export type Budget = {
  id: string;
  userId: string;
  year: number;
  month: number;
  income: number;
  categories: { [categoryId: string]: number };
};

export type BudgetDefaults = {
  userId: string;
  defaultIncome: number;
  defaultCategoryBudgets: { [categoryId: string]: number };
};

// In-memory budget store (replace with DB in production)
export const budgets: Budget[] = [];
export const budgetDefaults: BudgetDefaults[] = [];

const budgetRoute = {
  get: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const budget = budgets.find(
        (b) =>
          b.userId === ctx.userId &&
          b.year === input.year &&
          b.month === input.month
      );
      return budget || null;
    }),

  set: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(),
        income: z.number(),
        categories: z.record(z.string(), z.number()),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      let budget = budgets.find(
        (b) =>
          b.userId === ctx.userId &&
          b.year === input.year &&
          b.month === input.month
      );
      if (budget) {
        budget.income = input.income;
        budget.categories = input.categories;
      } else {
        budget = {
          id: `budget-${Date.now()}`,
          userId: ctx.userId as string,
          year: input.year,
          month: input.month,
          income: input.income,
          categories: input.categories,
        };
        budgets.push(budget);
      }
      return budget;
    }),

  delete: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      const idx = budgets.findIndex(
        (b) =>
          b.userId === ctx.userId &&
          b.year === input.year &&
          b.month === input.month
      );
      if (idx !== -1) budgets.splice(idx, 1);
      return { success: true };
    }),

  getDefaults: protectedProcedure.query(({ ctx }) => {
    if (!ctx.userId) throw new Error("Not authenticated");
    const defaults = budgetDefaults.find((d) => d.userId === ctx.userId);
    return (
      defaults || {
        defaultIncome: 0,
        defaultCategoryBudgets: {},
        userId: ctx.userId,
      }
    );
  }),

  setDefaults: protectedProcedure
    .input(
      z.object({
        defaultIncome: z.number(),
        defaultCategoryBudgets: z.record(z.string(), z.number()),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      let defaults = budgetDefaults.find((d) => d.userId === ctx.userId);
      if (defaults) {
        defaults.defaultIncome = input.defaultIncome;
        defaults.defaultCategoryBudgets = input.defaultCategoryBudgets;
      } else {
        defaults = {
          userId: ctx.userId as string,
          defaultIncome: input.defaultIncome,
          defaultCategoryBudgets: input.defaultCategoryBudgets,
        };
        budgetDefaults.push(defaults);
      }
      return defaults;
    }),
};

export default budgetRoute;
