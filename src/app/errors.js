export class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = options.fieldErrors ?? {};
    this.details = options.details ?? {};
    this.retryable = Boolean(options.retryable);
    this.correlationId = options.correlationId ?? `INC-${cryptoSafeToken()}`;
  }
}

export const cryptoSafeToken = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().slice(0, 8).toUpperCase();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
};

export function assertDomain(condition, code, message, options) {
  if (!condition) throw new AppError(code, message, options);
}

export function normalizeError(error, fallbackCode = 'OPERATION_FAILED') {
  if (error instanceof AppError) return error;
  return new AppError(fallbackCode, 'The operation could not be completed safely.', {
    retryable: true,
    cause: error,
  });
}
