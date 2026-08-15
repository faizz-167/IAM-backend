import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "../../constants";

export const registerSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters long"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
