export const Roles = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  FREELANCER: 'freelancer',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
