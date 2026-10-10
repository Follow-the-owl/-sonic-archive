// Centralized Authentication & Access Control Utility for The Owl Clock / LOMON

export const ADMIN_EMAILS: string[] = [
  "evianaconcepts1@gmail.com",
  "admin@system.local",
  "soluwatist@gmail.com"
];

/**
 * Check whether a given user email has administrator clearance.
 * Client / buyer accounts will return false.
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.toLowerCase().trim();
  if (!normalized) return false;

  // Check known admin accounts
  if (ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalized)) {
    return true;
  }

  // Check optional environment variable if configured
  try {
    const envAdmin = (import.meta as any)?.env?.VITE_ADMIN_EMAIL;
    if (envAdmin && typeof envAdmin === "string" && envAdmin.toLowerCase().trim() === normalized) {
      return true;
    }
  } catch (_e) {
    // Ignore in non-Vite environments
  }

  return false;
}

export type UserRole = "admin" | "client";

export function getUserRole(email?: string | null, explicitRole?: string | null): UserRole {
  if (explicitRole === "admin") return "admin";
  if (isAdminUser(email)) return "admin";
  return "client";
}
