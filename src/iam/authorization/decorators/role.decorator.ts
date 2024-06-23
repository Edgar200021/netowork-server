import { SetMetadata } from '@nestjs/common';
import { Role as TRole} from '../constants/role.constant';

export const ROLES_KEY = 'roles';


export const Role = (role: TRole) => SetMetadata(ROLES_KEY, role)