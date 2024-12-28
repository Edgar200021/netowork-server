import { roles } from 'src/drizzle/schema';

export type UserRole = (typeof roles.enumValues)[number];
