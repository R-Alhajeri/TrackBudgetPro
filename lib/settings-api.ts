import { trpcClient } from "@/lib/trpc";

export async function fetchSettings() {
  return await trpcClient.settings.get.query();
}

export async function updateSettings(settings: {
  theme: string;
  language: string;
  currency: string;
  notifications: boolean;
}) {
  return await trpcClient.settings.update.mutate(settings);
}
