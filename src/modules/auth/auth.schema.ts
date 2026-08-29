import { z } from "zod";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../../constants";

export const registerSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(255, "Display name must be at most 255 characters")
    .regex(/^[\p{L}][\p{L}'\- ]*$/u, {
      message:
        "Display name may contain only letters, spaces, hyphens and apostrophes",
    }),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters long")
    // Hashing is deliberately slow, so an unbounded password is a cheap way to
    // burn CPU. argon2 gains nothing past this length anyway.
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`,
    ),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(MAX_PASSWORD_LENGTH),
});

export const emailVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
