let sessionToken: string | null = null;

export async function saveSessionStore(token: string) {
  sessionToken = token;
}

export async function loadSessionStore() {
  if (!sessionToken) {
    return null;
  }
  return { token: sessionToken };
}

export async function clearSessionStore() {
  sessionToken = null;
}
