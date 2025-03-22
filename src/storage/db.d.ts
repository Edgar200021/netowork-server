/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type UserRole = "admin" | "client" | "freelancer";

export interface Users {
  aboutMe: string | null;
  avatar: string | null;
  avatarId: string | null;
  createdAt: Generated<Timestamp>;
  email: string;
  firstName: string;
  id: Generated<number>;
  isBanned: Generated<boolean>;
  isVerified: Generated<boolean>;
  lastName: string;
  password: string;
  role: UserRole;
  updatedAt: Generated<Timestamp>;
}

export interface DB {
  users: Users;
}
