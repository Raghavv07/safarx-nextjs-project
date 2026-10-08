import { z } from "zod";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string>; message: string };

/**
 * Validates any data against a Zod schema.
 * Useful for Server Actions and API Route Handlers.
 */
export function validateActionInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return {
    success: false,
    errors,
    message: result.error.issues[0]?.message || "Validation failed",
  };
}
