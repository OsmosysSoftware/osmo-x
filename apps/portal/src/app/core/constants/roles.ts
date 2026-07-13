export const UserRoles = {
  ORG_USER: 0,
  ORG_ADMIN: 1,
  SUPER_ADMIN: 2,
  // Outside the numeric hierarchy — filtered notification search access only
  NOTIFICATION_VIEWER: 3,
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRoles.ORG_USER]: 'User',
  [UserRoles.ORG_ADMIN]: 'Organization Admin',
  [UserRoles.SUPER_ADMIN]: 'Super Admin',
  [UserRoles.NOTIFICATION_VIEWER]: 'Notification Viewer',
};
