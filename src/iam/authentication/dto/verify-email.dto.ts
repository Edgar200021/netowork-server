import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty({ message: 'Почта не может быть пустой' })
  @IsEmail({}, { message: 'Формат почты не корректен' })
  email: string;

  @IsNotEmpty({ message: 'Токен не может быть пустой' })
  @IsString()
  token: string;
}
