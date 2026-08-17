export type ApiError = {
  message: string;
  code?: string;
  field?: string;
};

export type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T | null;
  meta?: Record<string, unknown>;
  errors?: ApiError[];
};

export function success<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiEnvelope<T> {
  return {
    status: "success",
    data,
    meta,
  };
}

export function fail(message: string, code?: string): ApiEnvelope<null> {
  return failWith([{ message, code }]);
}

export function failWith(errors: ApiError[]): ApiEnvelope<null> {
  return {
    status: "error",
    data: null,
    errors,
  };
}

export function fieldErrorsToApiErrors(
  fieldErrors: Record<string, string[]>,
): ApiError[] {
  return Object.entries(fieldErrors).flatMap(([field, messages]) =>
    messages.map((message) => ({ message, field })),
  );
}
