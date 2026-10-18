import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Webhook } from 'svix';

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async processWebhook(rawBody: string | Buffer, headers: Record<string, string>) {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    let evt: any;

    if (signingSecret) {
      try {
        const wh = new Webhook(signingSecret);
        evt = wh.verify(rawBody.toString(), headers);
      } catch (err: any) {
        this.logger.error('Invalid Svix webhook signature:', err.message);
        throw new BadRequestException('Invalid webhook signature.');
      }
    } else {
      // Offline / testing fallback without live webhook secret
      try {
        evt = JSON.parse(rawBody.toString());
      } catch {
        throw new BadRequestException('Malformed JSON payload.');
      }
    }

    const eventType = evt.type;
    const data = evt.data;
    const svixId = headers['svix-id'] || data?.id;

    if (!process.env.DATABASE_URL) {
      this.logger.log(`Processed Clerk event (offline mode): ${eventType}`);
      return { received: true };
    }

    // Check for duplicate webhook event (idempotency)
    const existingLog = await this.prisma.auditLog.findFirst({
      where: {
        action: `Webhook:${eventType}`,
        targetId: svixId,
      },
    });

    if (existingLog) {
      this.logger.log(`Ignoring duplicate webhook event ${svixId}`);
      return { received: true, duplicate: true };
    }

    switch (eventType) {
      case 'user.created': {
        const clerkUserId = data.id;
        const email = data.email_addresses?.[0]?.email_address;
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || null;

        // Check for matching pending invitation
        const invitation = await this.prisma.invitation.findFirst({
          where: {
            email,
            status: 'PENDING',
          },
        });

        if (invitation) {
          // Invited user activates immediately with assigned project
          await this.prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
              data: {
                clerkUserId,
                email,
                name: fullName,
                role: invitation.role,
                status: 'ACTIVE',
                profile: {
                  create: {
                    timezone: 'Africa/Lagos',
                  },
                },
              },
            });

            await tx.invitation.update({
              where: { id: invitation.id },
              data: {
                status: 'ACCEPTED',
                acceptedAt: new Date(),
              },
            });

            if (invitation.projectId) {
              await tx.projectMembership.create({
                data: {
                  projectId: invitation.projectId,
                  userId: user.id,
                  isDesignatedBillingContact: invitation.isDesignatedBillingContact,
                  isDesignatedApprover: invitation.isDesignatedApprover,
                },
              });
            }

            await tx.auditLog.create({
              data: {
                actorId: user.id,
                action: 'Webhook:user.created',
                targetType: 'User',
                targetId: svixId,
                metadata: {
                  message: 'User registered via verified invitation and activated.',
                  clerkUserId,
                  email,
                  projectId: invitation.projectId,
                },
              },
            });
          });
        } else {
          // Uninvited public signup creates a pending client awaiting Owner activation
          const user = await this.prisma.user.create({
            data: {
              clerkUserId,
              email,
              name: fullName,
              role: 'Client',
              status: 'PENDING_APPROVAL',
              profile: {
                create: {
                  timezone: 'Africa/Lagos',
                },
              },
            },
          });

          await this.prisma.auditLog.create({
            data: {
              actorId: user.id,
              action: 'Webhook:user.created',
              targetType: 'User',
              targetId: svixId,
              metadata: {
                message: 'Self-registered client created with PENDING_APPROVAL status.',
                clerkUserId,
                email,
              },
            },
          });
        }
        break;
      }

      case 'user.updated': {
        const clerkUserId = data.id;
        const email = data.email_addresses?.[0]?.email_address;
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || null;

        await this.prisma.user.updateMany({
          where: { clerkUserId },
          data: {
            email,
            name: fullName,
          },
        });
        break;
      }

      case 'user.deleted': {
        const clerkUserId = data.id;

        // Suspend user rather than hard deletion to preserve 90-day recovery window
        await this.prisma.user.updateMany({
          where: { clerkUserId },
          data: {
            status: 'SUSPENDED',
          },
        });

        await this.prisma.auditLog.create({
          data: {
            action: 'Webhook:user.deleted',
            targetType: 'User',
            targetId: svixId,
            metadata: {
              message: 'User marked SUSPENDED upon Clerk user.deleted event.',
              clerkUserId,
            },
          },
        });
        break;
      }

      default:
        this.logger.log(`Unhandled Clerk webhook event type: ${eventType}`);
    }

    return { received: true };
  }
}
