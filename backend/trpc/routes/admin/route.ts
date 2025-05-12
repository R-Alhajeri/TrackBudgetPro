import { adminProcedure } from "@/backend/trpc/create-context";
import { users } from "@/backend/trpc/routes/auth/route";
import { budgets } from "@/backend/trpc/routes/budget/route";
import { categories } from "@/backend/trpc/routes/category/route";
import { transactions } from "@/backend/trpc/routes/transaction/route";
import { receipts } from "@/backend/trpc/routes/receipt/route";

const adminRoute = {
  userList: adminProcedure.query(() => users.map(({ password, ...u }) => u)),
  budgetStats: adminProcedure.query(() => ({ count: budgets.length })),
  categoryStats: adminProcedure.query(() => ({ count: categories.length })),
  transactionStats: adminProcedure.query(() => ({
    count: transactions.length,
  })),
  receiptStats: adminProcedure.query(() => ({ count: receipts.length })),
  // Add more analytics as needed
};

export default adminRoute;
