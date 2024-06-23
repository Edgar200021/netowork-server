import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Почта не может быть пустой' })
  @IsEmail({}, { message: 'Формат почты не корректен' })
  email: string;

  @IsNotEmpty({ message: 'Токен не может быть пустой' })
  @IsString()
  token: string;

  @IsNotEmpty({
    message: 'Пароль не может быть пустым',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: 'Пароль должен содержать цифры, строчные и заглавные буквы' },
  )
  password: string;
}
