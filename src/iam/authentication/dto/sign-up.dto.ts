import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { UserRole, UserRoles } from 'src/user/constants/user-role.const';

export class SignUpDto {
  @IsNotEmpty({
    message: 'Имя не может быть пустым',
  })
  @IsString()
  name: string;

  @IsNotEmpty({
    message: 'Фамилия не может быть пустой',
  })
  @IsString()
  lastName: string;

  @IsNotEmpty({
    message: 'Почта не может быть пустой',
  })
  @IsEmail({}, { message: 'Формат почты не корректен' })
  email: string;

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

  @IsNotEmpty({
    message: 'Роль не может быть пустым',
  })
  @IsIn([UserRoles.CUSTOMER, UserRoles.FREELANCER], {
    message: `Должно быть один из значение ${UserRoles.CUSTOMER}, ${UserRoles.FREELANCER}`,
  })
  role: Omit<UserRole, 'admin'>;
}
