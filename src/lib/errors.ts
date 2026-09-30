export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "code" in error && error.code === "23505") {
    return "A category with that name already exists."
  }

  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message
  }

  return "Something went wrong. Please try again."
}
