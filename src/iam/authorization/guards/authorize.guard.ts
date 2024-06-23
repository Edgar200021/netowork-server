import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { REQUEST_USER_KEY } from 'src/iam/constants/request.constants';
import { User } from 'src/user/interfaces/user.interface';
import { Role } from '../constants/role.constant';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class AuthorizeGuard implements CanActivate {
  constructor(private readonly reflect: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const role = this.reflect.get<Role | undefined, string>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!role) return true;

    const user: User = context.switchToHttp().getRequest<Request>()[
      REQUEST_USER_KEY
    ];
    if (!user) throw new UnauthorizedException('Пользователь не авторизован');

    if (!user.role.includes(role))
      throw new ForbiddenException('Доступ запрещен');

    return true;
  }
}
