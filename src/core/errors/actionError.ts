export type ActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'INTERNAL_ERROR';

export type ActionResult = {
  ok: boolean;
  message: string;
  code?: ActionErrorCode;
};

export class ActionError extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    public readonly userMessage: string,
    public readonly details?: unknown,
  ) {
    super(userMessage);
    this.name = 'ActionError';
  }
}

export function toActionFailure(error: unknown, fallbackMessage = 'Ocurrio un error inesperado.'): ActionResult {
  if (error instanceof ActionError) {
    return {
      ok: false,
      message: error.userMessage,
      code: error.code,
    };
  }

  return {
    ok: false,
    message: fallbackMessage,
    code: 'INTERNAL_ERROR',
  };
}

