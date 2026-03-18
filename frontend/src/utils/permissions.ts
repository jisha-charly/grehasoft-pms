import { User, Permission } from "../types";

export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false;

  const rolePermissions = user.role_permissions;
  if (!Array.isArray(rolePermissions)) {
    // Fallback: If no dynamic permissions are found, deny access
    return false;
  }

  return rolePermissions.includes(permission);
};
