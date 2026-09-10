// Anything can be thrown in JavaScript, not just an Error, so every catch block that wants to
// show what went wrong has to narrow the same way. One helper keeps that narrowing identical
// across the app instead of repeating the ternary at each catch site.
export const describeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
