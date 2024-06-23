import { Controller, Get } from '@nestjs/common';
import { AuthTypes } from 'src/iam/authentication/constants/auth-type.constant';
import { Auth } from 'src/iam/authentication/decorators/auth.decorator';
import { Roles } from 'src/iam/authorization/constants/role.constant';
import { Role } from 'src/iam/authorization/decorators/role.decorator';

@Controller('user')
export class UserController {
  @Auth(AuthTypes.JWT)
  @Role(Roles.ADMIN)
  @Get('')
  findAll() {
    return 'OK';
  }
}
