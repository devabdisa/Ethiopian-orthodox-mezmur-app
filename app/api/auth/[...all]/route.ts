import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all route to handle all Better Auth endpoints (/api/auth/sign-in, /api/auth/session, etc)
export const { GET, POST } = toNextJsHandler(auth);
