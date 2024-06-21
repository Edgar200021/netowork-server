export const UserRoles = {
  ADMIN: 'admin',
  FREELANCER: 'freelancer',
  CUSTOMER: 'customer',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];
