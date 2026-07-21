let current = Object.freeze({ csrfToken: '', user: null });

export function setAuthSession({ csrfToken, user }) {
  current = Object.freeze({ csrfToken: String(csrfToken ?? ''), user: user ?? null });
  return current;
}

export function clearAuthSession() {
  current = Object.freeze({ csrfToken: '', user: null });
}

export function getAuthSession() {
  return current;
}

export function getCsrfToken() {
  return current.csrfToken;
}
