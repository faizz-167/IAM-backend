import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "../../constants";

export const registerSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .regex(/^[A-Za-z]+$/, { message: "Only letters are allowed" }),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters long"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const emailVerifySchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
