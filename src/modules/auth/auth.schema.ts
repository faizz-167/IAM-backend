import { z } from "zod";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../../constants";

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(255, "Display name must be at most 255 characters")
  .regex(/^[\p{L}][\p{L}'\- ]*$/u, {
    message:
      "Display name may contain only letters, spaces, hyphens and apostrophes",
  });

export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters long")
  // Hashing is deliberately slow, so an unbounded password is a cheap way to
  // burn CPU. argon2 gains nothing past this length anyway.
  .max(
    MAX_PASSWORD_LENGTH,
    `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`,
  );

export const registerSchema = z.object({
  display_name: displayNameSchema,
  email: z.email("Invalid email address"),
  password: newPasswordSchema,
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(MAX_PASSWORD_LENGTH),
});

export const emailVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Reset token is invalid"),
  password: newPasswordSchema,
});

export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
