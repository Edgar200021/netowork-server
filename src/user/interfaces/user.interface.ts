import { UserRole } from '../constants/user-role.const';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  last_name: string;
  role: UserRole;
  avatar: string | null;
  about: string | null;
  is_verified: boolean;
  verification_token: string | null;
  verification_expires: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  google_id: string | null;
  facebook_id: string | null;
}
