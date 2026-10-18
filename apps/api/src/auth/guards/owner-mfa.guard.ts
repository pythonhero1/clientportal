import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class OwnerMfaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'UNAUTHENTICATED',
        message: 'No authenticated user in request.',
      });
    }

    if (user.role === 'Owner') {
      if (!user.mfaEnforced) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'OWNER_MFA_REQUIRED',
          message: 'Multi-factor authentication (MFA) is mandatory for privileged Owner actions.',
        });
      }
    }

    return true;
  }
}
