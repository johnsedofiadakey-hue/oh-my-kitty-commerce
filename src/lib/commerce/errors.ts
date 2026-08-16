export type CommerceErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "OUT_OF_STOCK"
  | "VALIDATION_ERROR";

export class CommerceError extends Error {
  constructor(
    public readonly code: CommerceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "CommerceError";
  }
}
