import { createSafeActionClient } from "next-safe-action";
import { getSessionUser } from "@/actions/auth";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    return e instanceof Error ? e.message : "SERVER_ERROR";
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return next({ ctx: { user } });
});
