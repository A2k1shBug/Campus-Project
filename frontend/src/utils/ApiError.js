// Wraps a failed backend response so components can show a friendly
// message instead of a raw stack trace.
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}
