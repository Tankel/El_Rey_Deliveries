import { describe, expect, it } from 'vitest';
import { normalizeUsername, validateSignInInput } from '@/domain/rules/authRules';

describe('authRules', () => {
  it('normaliza username en minusculas y sin espacios', () => {
    expect(normalizeUsername('  Admin-Demo  ')).toBe('admin-demo');
  });

  it('valida username requerido', () => {
    const result = validateSignInInput({ username: '   ', password: '123456' });
    expect(result.ok).toBe(false);
    expect(result.message).toBe('Ingresa usuario.');
  });

  it('valida password requerido', () => {
    const result = validateSignInInput({ username: 'cliente-demo', password: '   ' });
    expect(result.ok).toBe(false);
    expect(result.message).toBe('Ingresa contrasena.');
  });

  it('acepta payload valido', () => {
    const result = validateSignInInput({ username: 'cliente-demo', password: 'cliente123' });
    expect(result.ok).toBe(true);
  });
});

