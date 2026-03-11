const PASSWORD_HASH_VERSION = 'v1';

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createSalt() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return toHex(bytes);
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 14)}`;
}

async function digest(value: string) {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.subtle && typeof TextEncoder !== 'undefined') {
    const encoded = new TextEncoder().encode(value);
    const buffer = await cryptoApi.subtle.digest('SHA-256', encoded);
    return toHex(new Uint8Array(buffer));
  }

  // Fallback local hash when SubtleCrypto is not available.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function isPasswordHashed(value: string) {
  return value.startsWith(`${PASSWORD_HASH_VERSION}$`);
}

export async function hashPassword(password: string, salt = createSalt()) {
  const hashed = await digest(`${salt}:${password}`);
  return `${PASSWORD_HASH_VERSION}$${salt}$${hashed}`;
}

export async function verifyPassword(rawPassword: string, storedPassword: string) {
  if (!storedPassword) {
    return false;
  }

  if (!isPasswordHashed(storedPassword)) {
    return rawPassword === storedPassword;
  }

  const [, salt, hashedValue] = storedPassword.split('$');
  if (!salt || !hashedValue) {
    return false;
  }

  const digestValue = await digest(`${salt}:${rawPassword}`);
  return digestValue === hashedValue;
}
