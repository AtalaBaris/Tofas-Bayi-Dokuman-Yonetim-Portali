/** localStorage / sessionStorage anahtarları — interceptor ve AuthService ortak kullanır. */
export const AUTH_TOKEN_KEY = 'bayi_portal_token';
export const AUTH_USER_KEY = 'bayi_portal_user';
export const BAYI_PROFILE_EXTRA_KEY = 'bayi_portal_profile_extra';

export function readStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(BAYI_PROFILE_EXTRA_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(BAYI_PROFILE_EXTRA_KEY);
}
