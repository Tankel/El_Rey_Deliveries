type ValidationResult = {
  ok: boolean;
  message: string;
};

export type SignInInput = {
  username: string;
  password: string;
};

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateSignInInput(input: SignInInput): ValidationResult {
  if (!normalizeUsername(input.username)) {
    return { ok: false, message: 'Ingresa usuario.' };
  }
  if (!input.password.trim()) {
    return { ok: false, message: 'Ingresa contrasena.' };
  }
  return { ok: true, message: 'ok' };
}

