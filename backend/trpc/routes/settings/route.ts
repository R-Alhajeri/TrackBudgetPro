import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export type UserSettings = {
  userId: string;
  theme: string;
  language: string;
  currency: string;
  notifications: boolean;
};

// In-memory settings store (replace with DB in production)
export const userSettings: UserSettings[] = [];

const settingsRoute = {
  get: protectedProcedure.query(({ ctx }) => {
    if (!ctx.userId) throw new Error("Not authenticated");
    let settings = userSettings.find((s) => s.userId === ctx.userId);
    if (!settings) {
      settings = {
        userId: ctx.userId as string,
        theme: "light",
        language: "en",
        currency: "USD",
        notifications: true,
      };
      userSettings.push(settings);
    }
    return settings;
  }),

  update: protectedProcedure
    .input(
      z.object({
        theme: z.string(),
        language: z.string(),
        currency: z.string(),
        notifications: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      let settings = userSettings.find((s) => s.userId === ctx.userId);
      if (!settings) {
        settings = {
          userId: ctx.userId as string,
          ...input,
        };
        userSettings.push(settings);
      } else {
        settings.theme = input.theme;
        settings.language = input.language;
        settings.currency = input.currency;
        settings.notifications = input.notifications;
      }
      return settings;
    }),
};

export default settingsRoute;
