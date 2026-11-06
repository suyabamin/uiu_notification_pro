/**
 * @module errors
 * @description Typed application error for portal and extension failures.
 */

export class AppError extends Error {
  public readonly code: string;

  /** Creates an application error with a stable code. @param code Error code. @param message Safe error message. @returns AppError instance. */
  public constructor(code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}
