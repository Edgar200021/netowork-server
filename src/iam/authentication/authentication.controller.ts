import { Body, Controller, Post } from '@nestjs/common';
import { ResponseService } from '../../common/services/response.service';
import { AuthService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly authService: AuthService,
  ) {}

  @Post('sign-in')
  async signIn() {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    await this.authService.signUp(signUpDto);

    return this.responseService.success('Регистрация прошла успешно');
  }
}
