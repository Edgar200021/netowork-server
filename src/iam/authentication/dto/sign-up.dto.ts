import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class SignUpDto {
  @IsNotEmpty({})
  @IsString()
  name: string;

  @IsNotEmpty({})
  @IsString()
  lastName: string;

  @IsNotEmpty({})
  @IsEmail()
  email: string;

  @IsNotEmpty({})
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
