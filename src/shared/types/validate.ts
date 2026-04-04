import type { z } from "zod";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError; formatted: string };

function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}

/**
 * Typed wrapper around {@link z.ZodSchema.safeParse} for storage/API boundaries.
 */
export function parseWithSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): ParseResult<z.infer<TSchema>> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error,
    formatted: formatZodError(result.error),
  };
}
