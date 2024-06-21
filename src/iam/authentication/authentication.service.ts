import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRepository } from '../../user/user.repository';
import { AuthRepository } from './authentication.repository';
import { SignUpDto } from './dto/sign-up.dto';
import { HashingService } from './hashing/hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly hashingService: HashingService,
  ) {}

  async signIn() {}

  async signUp({ email, password, name, lastName }: SignUpDto) {
    const user = await this.userRepository.getUserByEmail(email);
    if (user)
      throw new BadRequestException(`User with email ${email} already exists`);

    const hashedPassword = await this.hashingService.hash(password);

    await this.authRepository.signUp({
      email,
      name,
      lastName,
      hashedPassword,
    });
  }
}
