import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().max(254, "Email address is too long.").pipe(z.email("Enter a valid email address."));
const nameSchema = z.string().trim().min(1, "Enter your name.").max(80, "Use at most 80 characters.")
  .refine((value) => !/\p{Cc}/u.test(value), "Remove control characters from your name.");
export const profileSchema = z.object({ firstName: nameSchema, lastName: nameSchema });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128, "Password must be at most 128 characters."),
});

export const signupSchema = loginSchema.extend({
  firstName: nameSchema,
  lastName: nameSchema,
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Password must be at most 128 characters."),
});

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: { email?: string; password?: string; firstName?: string; lastName?: string } }
  | { status: "confirmation"; message: string };

const workspaceRoots = ["/dashboard", "/career-paths", "/learn", "/lessons", "/practice", "/progress", "/settings", "/onboarding"];

export function isProtectedPath(path: string) {
  return path === "/" || workspaceRoots.some((root) => path === root || path.startsWith(`${root}/`));
}

/** Only existing workspace paths are valid post-auth destinations; never accept an arbitrary URL. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") ||
      value.startsWith("//") || /[\\\s%#]/.test(value.split("?")[0])) return "/dashboard";
  try {
    const parsed = new URL(value, "https://app.invalid");
    if (parsed.origin !== "https://app.invalid" || !isProtectedPath(parsed.pathname) || parsed.pathname === "/") {
      return "/dashboard";
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/dashboard";
  }
}
