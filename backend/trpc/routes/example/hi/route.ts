import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export default publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
        return {
            hello: input.name,
            date: new Date(),
        };
    });