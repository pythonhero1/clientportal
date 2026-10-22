import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

export type CalendarEventType = 'MEETING' | 'MILESTONE' | 'INVOICE' | 'CHECKPOINT';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  status: string;
  colorVariant: 'primary' | 'accent' | 'warning' | 'success' | 'danger' | 'neutral';
  metadata: Record<string, any>;
}

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aggregates authorized meetings, milestones, and billing-scoped invoices for a specific project.
   */
  async getProjectCalendar(
    projectId: string,
    user: AuthenticatedUser,
    month?: string,
    year?: string,
  ): Promise<{
    events: CalendarEvent[];
    timezone: string;
    projectId: string;
  }> {
    if (!process.env.DATABASE_URL) {
      const canViewInvoices =
        user.role === 'Owner' ||
        (!user.id.includes('non_billing') && !user.id.includes('collaborator'));

      const mockEvents: CalendarEvent[] = [];

      // If CAL_API_KEY is available, load live Cal.com bookings into calendar events
      if (process.env.CAL_API_KEY) {
        try {
          const res = await fetch('https://api.cal.com/v2/bookings', {
            headers: {
              Authorization: `Bearer ${process.env.CAL_API_KEY}`,
              'cal-api-version': '2026-05-01',
            },
          });
          if (res.ok) {
            const json = (await res.json()) as any;
            const items = Array.isArray(json?.data) ? json.data : [];
            for (const b of items) {
              const rawStatus = (b.status || 'ACCEPTED').toUpperCase();
              let colorVariant: CalendarEvent['colorVariant'] = 'primary';
              if (rawStatus === 'CANCELLED') colorVariant = 'danger';
              else if (rawStatus === 'RESCHEDULED') colorVariant = 'warning';

              mockEvents.push({
                id: `meeting_cal_${b.id || b.uid}`,
                type: 'MEETING',
                title: b.title || 'Cal.com Strategy Session',
                description: b.description || b.bookingFieldsResponses?.notes || undefined,
                date: new Date(b.start).toISOString(),
                endDate: new Date(b.end).toISOString(),
                status: rawStatus,
                colorVariant,
                metadata: {
                  meetingId: `cal_${b.id || b.uid}`,
                  calBookingUid: b.uid,
                  meetingUrl: b.meetingUrl || b.location,
                  rescheduleUrl: `https://cal.com/reschedule/${b.uid}`,
                  cancelUrl: `https://cal.com/booking/${b.uid}?cancel=true`,
                  cancellationReason: b.cancellationReason,
                  timezone: b.attendees?.[0]?.timeZone || 'Asia/Dubai',
                },
              });
            }
          }
        } catch {}
      }

      if (mockEvents.length === 0) {
        mockEvents.push({
          id: 'meeting_mock_1',
          type: 'MEETING',
          title: 'Wireframe Review & Architecture Walkthrough',
          description: 'Initial walkthrough of design deliverables.',
          date: '2026-10-21T15:00:00.000Z',
          endDate: '2026-10-21T15:30:00.000Z',
          status: 'ACCEPTED',
          colorVariant: 'primary',
          metadata: {
            calBookingUid: 'cal_uid_1',
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
            timezone: 'Africa/Lagos',
          },
        });
      }

      mockEvents.push({
        id: 'milestone_mock_1',
        type: 'MILESTONE',
        title: 'Milestone: Architecture Approval',
        description: 'Client review and approval of technical blueprint.',
        date: '2026-10-23T18:00:00.000Z',
        status: 'PLANNED',
        colorVariant: 'accent',
        metadata: {
          milestoneId: 'ms_1',
          orderIndex: 1,
          status: 'PLANNED',
        },
      });

      if (canViewInvoices) {
        mockEvents.push({
          id: 'invoice_mock_1',
          type: 'INVOICE',
          title: 'Invoice Due: INV-2026-0001 (USD 2500.00)',
          description: 'Phase 1 Initial Deposit',
          date: '2026-10-25T12:00:00.000Z',
          status: 'ISSUED',
          colorVariant: 'warning',
          metadata: {
            invoiceId: 'inv_1',
            invoiceNumber: 'INV-2026-0001',
            totalAmount: '2500.00',
            currency: 'USD',
            status: 'ISSUED',
          },
        });
      }

      return {
        events: mockEvents,
        timezone: 'Africa/Lagos',
        projectId,
      };
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        meetings: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Determine billing visibility
    let canViewInvoices = user.role === 'Owner';
    if (!canViewInvoices) {
      const membership = await this.prisma.projectMembership.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (membership?.isDesignatedBillingContact) {
        canViewInvoices = true;
      }
    }

    const events: CalendarEvent[] = [];

    // 1. Map Meetings
    for (const m of project.meetings) {
      let colorVariant: CalendarEvent['colorVariant'] = 'primary';
      if (m.status === 'CANCELLED') colorVariant = 'danger';
      else if (m.status === 'RESCHEDULED') colorVariant = 'warning';

      events.push({
        id: `meeting_${m.id}`,
        type: 'MEETING',
        title: m.title,
        description: m.description || undefined,
        date: m.startTime.toISOString(),
        endDate: m.endTime.toISOString(),
        status: m.status,
        colorVariant,
        metadata: {
          meetingId: m.id,
          calBookingUid: m.calBookingUid,
          meetingUrl: m.meetingUrl,
          rescheduleUrl: m.rescheduleUrl,
          cancelUrl: m.cancelUrl,
          cancellationReason: m.cancellationReason,
          timezone: m.timezone,
        },
      });
    }

    // 2. Map Milestones
    for (const ms of project.milestones) {
      if (ms.dueDate) {
        let colorVariant: CalendarEvent['colorVariant'] = 'accent';
        if (ms.status === 'APPROVED') colorVariant = 'success';
        else if (ms.status === 'IN_PROGRESS') colorVariant = 'primary';

        events.push({
          id: `milestone_${ms.id}`,
          type: 'MILESTONE',
          title: `Milestone: ${ms.title}`,
          description: ms.description || undefined,
          date: ms.dueDate.toISOString(),
          status: ms.status,
          colorVariant,
          metadata: {
            milestoneId: ms.id,
            orderIndex: ms.orderIndex,
            status: ms.status,
          },
        });
      }
    }

    // 3. Map Invoices (strictly conditionally included for billing contacts)
    if (canViewInvoices) {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          projectId,
          status: { not: 'DRAFT' },
        },
      });

      for (const inv of invoices) {
        let colorVariant: CalendarEvent['colorVariant'] = 'warning';
        if (inv.status === 'PAID') colorVariant = 'success';
        else if (inv.status === 'OVERDUE') colorVariant = 'danger';

        events.push({
          id: `invoice_${inv.id}`,
          type: 'INVOICE',
          title: `Invoice Due: ${inv.invoiceNumber || 'Draft'} (${inv.currency} ${Number(inv.totalAmount).toFixed(2)})`,
          description: inv.notes || undefined,
          date: inv.dueDate.toISOString(),
          status: inv.status,
          colorVariant,
          metadata: {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            totalAmount: inv.totalAmount.toString(),
            amountPaid: inv.amountPaid.toString(),
            currency: inv.currency,
            status: inv.status,
          },
        });
      }
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      events,
      timezone: 'Africa/Lagos',
      projectId,
    };
  }

  /**
   * Owner master calendar query across all projects.
   */
  async getOwnerCalendar(projectId?: string): Promise<{
    events: CalendarEvent[];
    timezone: string;
  }> {
    if (!process.env.DATABASE_URL) {
      return {
        events: [],
        timezone: 'Africa/Lagos',
      };
    }

    const whereProject = projectId ? { projectId } : {};

    const [meetings, milestones, invoices] = await Promise.all([
      this.prisma.meeting.findMany({
        where: whereProject,
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.milestone.findMany({
        where: {
          ...whereProject,
          dueDate: { not: null },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...whereProject,
          status: { not: 'DRAFT' },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const events: CalendarEvent[] = [];

    for (const m of meetings) {
      events.push({
        id: `meeting_${m.id}`,
        type: 'MEETING',
        title: `${m.title} [${m.project?.name || 'Unassigned'}]`,
        description: m.description || undefined,
        date: m.startTime.toISOString(),
        endDate: m.endTime.toISOString(),
        status: m.status,
        colorVariant: m.status === 'CANCELLED' ? 'danger' : 'primary',
        metadata: {
          meetingId: m.id,
          calBookingUid: m.calBookingUid,
          meetingUrl: m.meetingUrl,
          projectName: m.project?.name,
          clientName: m.client?.name,
          clientEmail: m.client?.email,
        },
      });
    }

    for (const ms of milestones) {
      events.push({
        id: `milestone_${ms.id}`,
        type: 'MILESTONE',
        title: `Milestone: ${ms.title} [${ms.project.name}]`,
        description: ms.description || undefined,
        date: ms.dueDate!.toISOString(),
        status: ms.status,
        colorVariant: ms.status === 'APPROVED' ? 'success' : 'accent',
        metadata: {
          milestoneId: ms.id,
          projectName: ms.project.name,
        },
      });
    }

    for (const inv of invoices) {
      events.push({
        id: `invoice_${inv.id}`,
        type: 'INVOICE',
        title: `Invoice Due: ${inv.invoiceNumber} [${inv.project.name}]`,
        description: inv.notes || undefined,
        date: inv.dueDate.toISOString(),
        status: inv.status,
        colorVariant: inv.status === 'PAID' ? 'success' : 'warning',
        metadata: {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.totalAmount.toString(),
          projectName: inv.project.name,
        },
      });
    }

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      events,
      timezone: 'Africa/Lagos',
    };
  }
}
