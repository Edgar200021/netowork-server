import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { UserRole, UserRoles } from 'src/user/constants/user-role.const';

export class FacebookOAuthDto {
  @IsString()
  code: string;

  @IsNotEmpty({
    message: 'Роль не может быть пустым',
  })
  @IsIn([UserRoles.CUSTOMER, UserRoles.FREELANCER], {
    message: `Должно быть один из значение ${UserRoles.CUSTOMER}, ${UserRoles.FREELANCER}`,
  })
  role: Omit<UserRole, 'admin'>;
}
