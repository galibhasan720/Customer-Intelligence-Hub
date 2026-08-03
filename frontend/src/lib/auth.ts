/** Auth token helpers for Seat-Flow local JWT. */

const TOKEN_KEY = "seatflow_token";
const USER_KEY = "seatflow_user";

export type UserRole = "customer" | "organizer" | "admin";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole | string;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isOrganizerOrAdmin(role: string): boolean {
  return role === "organizer" || role === "admin";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function roleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "organizer") return "Organizer";
  return "Customer";
}
