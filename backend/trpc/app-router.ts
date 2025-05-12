import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import processReceiptRoute from "@/backend/trpc/routes/receipt/process/route";
import authRoute from "@/backend/trpc/routes/auth/route";
import userRoute from "@/backend/trpc/routes/user/route";
import budgetRoute from "@/backend/trpc/routes/budget/route";
import categoryRoute from "@/backend/trpc/routes/category/route";
import transactionRoute from "@/backend/trpc/routes/transaction/route";
import receiptRoute from "@/backend/trpc/routes/receipt/route";
import adminRoute from "@/backend/trpc/routes/admin/route";
import settingsRoute from "@/backend/trpc/routes/settings/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: authRoute,
  user: userRoute,
  budget: budgetRoute,
  category: categoryRoute,
  transaction: transactionRoute,
  receipt: createTRPCRouter({
    process: processReceiptRoute,
    main: receiptRoute,
  }),
  admin: adminRoute,
  settings: settingsRoute,
});

export type AppRouter = typeof appRouter;
