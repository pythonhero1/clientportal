import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('Owner' | 'Client')[]) => SetMetadata(ROLES_KEY, roles);
