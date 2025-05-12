import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { users, User } from "@/backend/trpc/routes/auth/route";

const userRoute = {
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2) }))
    .mutation(({ ctx, input }) => {
      const user = users.find((u: User) => u.id === ctx.userId);
      if (!user) throw new Error("User not found");
      user.name = input.name;
      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({ oldPassword: z.string(), newPassword: z.string().min(6) })
    )
    .mutation(({ ctx, input }) => {
      const user = users.find((u: User) => u.id === ctx.userId);
      if (!user) throw new Error("User not found");
      if (!bcrypt.compareSync(input.oldPassword, user.password)) {
        throw new Error("Old password incorrect");
      }
      user.password = bcrypt.hashSync(input.newPassword, 10);
      return { success: true };
    }),

  createSubscriptionPayment: protectedProcedure
    .input(
      z.object({
        customerName: z.string(),
        customerEmail: z.string().email(),
        customerMobile: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use userId from context for tracking

      const result = await createSubscriptionInvoice({
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerMobile: input.customerMobile,
        userId: ctx.userId!,
        callbackUrl,
        errorUrl,
      });
      return result;
    }),

  getSubscriptionStatus: protectedProcedure.query(({ ctx }) => {
    const user = users.find((u) => u.id === ctx.userId);
    return user?.subscription || { status: "none" };
  }),
};

export default userRoute;
