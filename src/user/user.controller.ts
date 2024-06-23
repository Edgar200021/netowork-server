import { Controller, Get } from '@nestjs/common';
import { AuthTypes } from 'src/iam/authentication/constants/auth-type.constant';
import { Auth } from 'src/iam/authentication/decorators/auth.decorator';

@Controller('user')
export class UserController {
  @Auth(AuthTypes.NONE)
  @Get('')
  findAll() {
    return 'OK';
  }
}
