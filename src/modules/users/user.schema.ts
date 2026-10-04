import { z } from "zod";
import { MAX_PASSWORD_LENGTH } from "../../constants";
import { displayNameSchema, newPasswordSchema } from "../auth/auth.schema";

const currentPasswordSchema = z
  .string()
  .min(1, "Current password is required")
  .max(MAX_PASSWORD_LENGTH);

export const updateMeSchema = z.object({
  display_name: displayNameSchema,
});

export const changePasswordSchema = z.object({
  current_password: currentPasswordSchema,
  new_password: newPasswordSchema,
});

export const deleteMeSchema = z.object({
  password: currentPasswordSchema,
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
