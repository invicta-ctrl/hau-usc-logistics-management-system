export const AUTH_API_ROUTES = Object.freeze({
  session: '/api/auth/session',
  login: '/api/auth/login',
  activate: '/api/auth/activate',
  logout: '/api/auth/logout',
  resetComplete: '/api/auth/reset/complete',
});

export const AUTH_STATE = Object.freeze({
  SIGNED_OUT: 'SIGNED_OUT',
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
  AUTHENTICATED: 'AUTHENTICATED',
});
