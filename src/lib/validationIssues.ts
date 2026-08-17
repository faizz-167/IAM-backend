import type { ZodError } from "zod";

export function toFieldErrors(
  error: ZodError,
  fallbackField: string,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.length ? issue.path.join(".") : fallbackField;
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}
