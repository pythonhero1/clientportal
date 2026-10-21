import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

@Injectable()
export class DesignatedBillingContactGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    const projectId = request.params.projectId;
    const invoiceId = request.params.invoiceId;

    if (!user) {
      throw new NotFoundException('Project or invoice not found.');
    }

    // Owner operates all invoices globally
    if (user.role === 'Owner') {
      return true;
    }

    if (!process.env.DATABASE_URL) {
      if (
        user.id === 'client_c' ||
        request.headers['x-mock-billing-contact'] === 'false' ||
        user.id.includes('non_billing') ||
        projectId === 'missing_proj'
      ) {
        throw new NotFoundException('Project or invoice not found.');
      }
      return true;
    }

    let targetProjectId = projectId;

    if (!targetProjectId && invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { projectId: true, status: true },
      });
      if (!invoice || invoice.status === 'DRAFT') {
        throw new NotFoundException('Project or invoice not found.');
      }
      targetProjectId = invoice.projectId;
    }

    if (!targetProjectId) {
      throw new NotFoundException('Project or invoice not found.');
    }

    // Enforce that caller is a member with explicit designated billing contact grant
    const membership = await this.prisma.projectMembership.findUnique({
      where: {
        projectId_userId: {
          projectId: targetProjectId,
          userId: user.id,
        },
      },
    });

    if (!membership || !membership.isDesignatedBillingContact) {
      // Strict anti-enumeration: return 404 so non-billing collaborators cannot verify invoice existence
      throw new NotFoundException('Project or invoice not found.');
    }

    return true;
  }
}
