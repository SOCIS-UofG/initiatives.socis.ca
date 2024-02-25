import { initiativesRouter } from "./routers/initiatives";
import { router } from "./trpc";

export const appRouter = router({
  ...initiativesRouter,
});

export type AppRouter = typeof appRouter;
