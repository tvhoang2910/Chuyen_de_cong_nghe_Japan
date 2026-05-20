/**
 * Development helper for authentication mocking.
 * Used to test SYSTEM_ADMIN and other roles without backend.
 *
 * Remove or disable this in production builds.
 */

import { persistAuthSession, clearAuthSession } from "../api/axiosClient";

export type MockRole =
  | "USER"
  | "CONTRIBUTOR"
  | "ADMIN"
  | "AUDIT"
  | "SYSTEM_ADMIN";

export interface MockAuthUser {
  id: number;
  email: string;
  fullName: string;
  role: MockRole;
}

const mockUsers: Record<MockRole, MockAuthUser> = {
  USER: {
    id: 1,
    email: "student@jstudy.vn",
    fullName: "Học Sinh Test",
    role: "USER",
  },
  CONTRIBUTOR: {
    id: 2,
    email: "teacher@jstudy.vn",
    fullName: "Giáo Viên Test",
    role: "CONTRIBUTOR",
  },
  ADMIN: {
    id: 3,
    email: "admin@jstudy.vn",
    fullName: "Quản Trị Viên Test",
    role: "ADMIN",
  },
  AUDIT: {
    id: 4,
    email: "audit@jstudy.vn",
    fullName: "Kiểm Toán Test",
    role: "AUDIT",
  },
  SYSTEM_ADMIN: {
    id: 5,
    email: "sysadmin@jstudy.vn",
    fullName: "Quản Trị Hệ Thống Test",
    role: "SYSTEM_ADMIN",
  },
};

/**
 * Mock login with a specific role.
 * Sets up localStorage as if user successfully logged in.
 */
export const mockLoginAsRole = (role: MockRole): void => {
  const user = mockUsers[role];
  if (!user) {
    console.error(`[MockAuth] Unknown role: ${role}`);
    return;
  }

  // Simulate JWT token (not used for validation in this mock)
  const mockToken = `mock-jwt-token-${role}-${Date.now()}`;

  // Set auth state exactly as persistAuthSession would
  persistAuthSession({
    accessToken: mockToken,
    email: user.email,
    role: user.role,
  });

  console.log(`[MockAuth] Logged in as ${role}: ${user.fullName}`);
};

/**
 * Mock logout - clear all auth state.
 */
export const mockLogout = (): void => {
  clearAuthSession();
  console.log("[MockAuth] Logged out");
};

/**
 * Get current mock user from localStorage.
 */
export const getMockCurrentUser = (): MockAuthUser | null => {
  const role = localStorage.getItem("user_role") as MockRole | null;
  if (!role) {
    return null;
  }
  return mockUsers[role] || null;
};

/**
 * Check if development mode is enabled.
 * In production, this should always return false.
 */
const isDevelopmentMode = (): boolean => {
  if (globalThis.location?.search.includes("dev-auth=true")) {
    return true;
  }
  // Check Vite env variable
  return import.meta.env.DEV;
};

/**
 * Development console that provides mock auth commands.
 * Access with window.__mockAuth in browser console.
 */
export const setupDevAuthConsole = (): void => {
  if (!isDevelopmentMode()) {
    return;
  }

  (globalThis as any).__mockAuth = {
    loginAsSystemAdmin: () => mockLoginAsRole("SYSTEM_ADMIN"),
    loginAsAudit: () => mockLoginAsRole("AUDIT"),
    loginAsAdmin: () => mockLoginAsRole("ADMIN"),
    loginAsContributor: () => mockLoginAsRole("CONTRIBUTOR"),
    loginAsUser: () => mockLoginAsRole("USER"),
    logout: mockLogout,
    currentUser: getMockCurrentUser,
    roles: Object.keys(mockUsers),
    help: () => {
      console.log(`
[MockAuth] Available commands (Development Mode):
  window.__mockAuth.loginAsSystemAdmin()     - Login as SYSTEM_ADMIN
  window.__mockAuth.loginAsAudit()           - Login as AUDIT
  window.__mockAuth.loginAsAdmin()           - Login as ADMIN
  window.__mockAuth.loginAsContributor()     - Login as CONTRIBUTOR
  window.__mockAuth.loginAsUser()            - Login as USER
  window.__mockAuth.logout()                 - Logout
  window.__mockAuth.currentUser()            - Get current mock user
  window.__mockAuth.roles                    - List all available roles
      `);
    },
  };

  console.log(
    "[MockAuth] Development auth console loaded. Type: window.__mockAuth.help()",
  );
};
