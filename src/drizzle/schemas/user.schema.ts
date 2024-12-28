import { boolean, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const roles = pgEnum('role', ['client', 'freelancer', 'admin']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  role: roles().notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
});
