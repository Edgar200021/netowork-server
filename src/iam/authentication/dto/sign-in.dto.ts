import { IsEmail, IsString } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Формат почты не корректен' })
  email: string;

  @IsString()
  password: string;
}


