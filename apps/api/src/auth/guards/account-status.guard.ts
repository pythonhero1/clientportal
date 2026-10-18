import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class AccountStatusGuard implements CanActivate {
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

    if (user.status === 'PENDING_APPROVAL') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_PENDING_APPROVAL',
        message: 'Your account is pending Owner approval.',
      });
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact Stephen.',
      });
    }

    if (user.status === 'REJECTED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_REJECTED',
        message: 'Your portal access request was not approved.',
      });
    }

    return user.status === 'ACTIVE';
  }
}
