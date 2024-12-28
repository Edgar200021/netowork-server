import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthenticationService } from './providers/authentication.service';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('/register')
  async register(@Body() payload: RegisterDto) {
    await this.authService.register(payload);

    return 'On your email you will receive a link to verify your account';
  }
}
