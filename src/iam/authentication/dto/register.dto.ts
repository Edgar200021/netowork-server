import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/users/types/role.enum';

export class RegisterDto {
  @IsNotEmpty({
    message: 'First name is required',
  })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @IsNotEmpty({
    message: 'Last name is required',
  })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(40, { message: 'Password must be at most 40 characters' })
  password: string;

  @IsNotEmpty({ message: 'Role is required' })
  @Transform(({ value }) => ('' + value).toLowerCase())
  @IsIn(['client', 'freelancer'] as Exclude<UserRole, 'admin'>[], {
    message: 'Invalid role',
  })
  role: Exclude<UserRole, 'admin'>;
}
