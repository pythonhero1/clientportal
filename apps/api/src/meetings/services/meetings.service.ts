import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { UpdateMeetingDto } from '../dto/update-meeting.dto.js';
import { MeetingStatus } from '@prisma/client';
import crypto from 'crypto';

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a short-lived, tamper-proof HMAC-SHA256 signed booking token.
   * This proves the client booking via Cal.com is genuinely authorized for the specified project.
   */
  generateBookingToken(projectId: string, user: AuthenticatedUser) {
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity
    const secret = process.env.INTERNAL_SIGNING_SECRET || 'portal-calcom-internal-token-secret';

    const payload = {
      projectId,
      userId: user.id,
      email: user.email,
      expiresAt,
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const token = `${payloadB64}.${signature}`;

    return {
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      calUsername: process.env.CALCOM_DEFAULT_USERNAME || 'oderinde',
      eventSlug: process.env.CALCOM_DEFAULT_EVENT || 'free',
    };
  }

  /**
   * Fetches real live bookings from Cal.com API v2 using Stephen's configured API key.
   */
  private async fetchLiveCalComBookings(): Promise<any[]> {
    const apiKey = process.env.CAL_API_KEY;
    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.cal.com/v2/bookings', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': '2026-05-01',
        },
      });

      if (!response.ok) {
        return [];
      }

      const json = (await response.json()) as any;
      return Array.isArray(json?.data) ? json.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Maps a Cal.com API v2 booking payload into the unified portal Meeting contract.
   */
  private mapCalComBookingToMeeting(
    b: any,
    fallbackProjectId = 'proj_1',
    fallbackUser?: AuthenticatedUser,
  ) {
    const rawStatus = (b.status || 'ACCEPTED').toUpperCase();
    const status: MeetingStatus =
      rawStatus === 'CANCELLED'
        ? MeetingStatus.CANCELLED
        : rawStatus === 'RESCHEDULED'
        ? MeetingStatus.RESCHEDULED
        : MeetingStatus.ACCEPTED;

    const primaryAttendee = b.attendees?.[0];
    const host = b.hosts?.[0];

    const meetingUrl =
      b.meetingUrl ||
      b.location ||
      (b.uid ? `https://cal.com/${host?.username || 'oderinde'}/${b.eventType?.slug || 'free'}` : null);
    const rescheduleUrl = b.uid ? `https://cal.com/reschedule/${b.uid}` : null;
    const cancelUrl = b.uid ? `https://cal.com/booking/${b.uid}?cancel=true` : null;

    const projectId = b.metadata?.projectId || fallbackProjectId;
    const clientId = fallbackUser?.id || (primaryAttendee ? `client_${primaryAttendee.email}` : 'client_cal');
    const clientName = primaryAttendee?.name || fallbackUser?.name || 'Client';
    const clientEmail = primaryAttendee?.email || fallbackUser?.email || 'client@example.com';

    return {
      id: `cal_${b.id || b.uid}`,
      calBookingUid: b.uid || String(b.id),
      calBookingId: String(b.id),
      projectId,
      clientId,
      title: b.title || 'Strategy Call with Stephen',
      description: b.description || b.bookingFieldsResponses?.notes || 'Scheduled via Cal.com',
      status,
      startTime: new Date(b.start),
      endTime: new Date(b.end),
      timezone: primaryAttendee?.timeZone || host?.timeZone || 'Asia/Dubai',
      meetingUrl,
      rescheduleUrl,
      cancelUrl,
      cancellationReason: b.cancellationReason || null,
      attendees:
        b.attendees?.map((a: any) => ({
          name: a.name || 'Attendee',
          email: a.email,
          timeZone: a.timeZone,
        })) || [],
      project: {
        id: projectId,
        name: 'Stephen Showcase Website',
      },
      client: {
        id: clientId,
        name: clientName,
        email: clientEmail,
      },
      createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
      updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
    };
  }

  /**
   * Retrieves active Cal.com event types for booking selection.
   */
  async getEventTypes() {
    const apiKey = process.env.CAL_API_KEY;
    if (!apiKey) {
      return [
        {
          id: 4862054,
          title: 'Free Website Strategy Call (60 Minutes)',
          slug: 'free',
          lengthInMinutes: 60,
          bookingUrl: 'https://cal.com/oderinde/free',
        },
        {
          id: 4862053,
          title: '15 min meeting',
          slug: '15min',
          lengthInMinutes: 15,
          bookingUrl: 'https://cal.com/oderinde/15min',
        },
      ];
    }

    try {
      const response = await fetch('https://api.cal.com/v2/event-types', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': '2026-06-12',
        },
      });

      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.statusText}`);
      }

      const body = (await response.json()) as any;
      const items = Array.isArray(body?.data) ? body.data : [];

      return items.map((et: any) => ({
        id: et.id,
        title: et.title,
        slug: et.slug,
        lengthInMinutes: et.lengthInMinutes,
        description: et.description || '',
        bookingUrl: et.bookingUrl || `https://cal.com/oderinde/${et.slug}`,
      }));
    } catch {
      return [
        {
          id: 4862054,
          title: 'Free Website Strategy Call (60 Minutes)',
          slug: 'free',
          lengthInMinutes: 60,
          bookingUrl: 'https://cal.com/oderinde/free',
        },
      ];
    }
  }

  /**
   * Retrieves meetings scoped to a specific project.
   */
  async getProjectMeetings(projectId: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      const liveCalBookings = await this.fetchLiveCalComBookings();
      if (liveCalBookings.length > 0) {
        return liveCalBookings.map((b) =>
          this.mapCalComBookingToMeeting(b, projectId, user),
        );
      }

      return [
        {
          id: 'meet_1',
          calBookingUid: 'cal_uid_1',
          calBookingId: '849201',
          projectId,
          clientId: user.id,
          title: 'Wireframe Review & Architecture Walkthrough',
          description: 'Strategy session with Stephen',
          status: MeetingStatus.ACCEPTED,
          startTime: new Date('2026-10-21T15:00:00.000Z'),
          endTime: new Date('2026-10-21T15:30:00.000Z'),
          timezone: 'Africa/Lagos',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          rescheduleUrl: 'https://cal.com/reschedule/cal_uid_1',
          cancelUrl: 'https://cal.com/booking/cal_uid_1?cancel=true',
          attendees: [{ name: user.name || 'Client', email: user.email }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    // Owner sees all meetings on project; Client sees meetings on their project
    const meetings = await this.prisma.meeting.findMany({
      where: {
        projectId,
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const liveCalBookings = await this.fetchLiveCalComBookings();
    if (liveCalBookings.length > 0) {
      const existingUids = new Set(meetings.map((m) => m.calBookingUid));
      for (const b of liveCalBookings) {
        if (!existingUids.has(b.uid)) {
          meetings.push(this.mapCalComBookingToMeeting(b, projectId, user) as any);
        }
      }
    }

    return meetings;
  }

  /**
   * Retrieves all upcoming meetings for the authenticated client across their projects.
   */
  async getClientMeetings(user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      const liveCalBookings = await this.fetchLiveCalComBookings();
      if (liveCalBookings.length > 0) {
        return liveCalBookings.map((b) =>
          this.mapCalComBookingToMeeting(b, 'proj_1', user),
        );
      }

      return [
        {
          id: 'meet_1',
          calBookingUid: 'cal_uid_1',
          calBookingId: '849201',
          projectId: 'proj_1',
          clientId: user.id,
          title: 'Wireframe Review & Architecture Walkthrough',
          description: 'Strategy session with Stephen',
          status: MeetingStatus.ACCEPTED,
          startTime: new Date('2026-10-21T15:00:00.000Z'),
          endTime: new Date('2026-10-21T15:30:00.000Z'),
          timezone: 'Africa/Lagos',
          project: {
            id: 'proj_1',
            name: 'Stephen Showcase Website',
          },
        },
      ];
    }

    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });

    const projectIds = memberships.map((m) => m.projectId);

    const meetings = await this.prisma.meeting.findMany({
      where: {
        OR: [
          { clientId: user.id },
          { projectId: { in: projectIds } },
        ],
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const liveCalBookings = await this.fetchLiveCalComBookings();
    if (liveCalBookings.length > 0) {
      const existingUids = new Set(meetings.map((m) => m.calBookingUid));
      for (const b of liveCalBookings) {
        if (!existingUids.has(b.uid)) {
          meetings.push(this.mapCalComBookingToMeeting(b, 'proj_1', user) as any);
        }
      }
    }

    return meetings;
  }

  /**
   * Owner global query across all meetings with filtering.
   */
  async getAllMeetingsForOwner(filters?: {
    projectId?: string;
    status?: MeetingStatus;
    from?: string;
    to?: string;
  }) {
    const liveCalBookings = await this.fetchLiveCalComBookings();
    const mappedLive = liveCalBookings.map((b) =>
      this.mapCalComBookingToMeeting(b, filters?.projectId || 'proj_1'),
    );

    if (!process.env.DATABASE_URL) {
      let filtered = mappedLive;
      if (filters?.status) {
        filtered = filtered.filter((m) => m.status === filters.status);
      }
      if (filters?.from) {
        const fromDate = new Date(filters.from).getTime();
        filtered = filtered.filter((m) => m.startTime.getTime() >= fromDate);
      }
      if (filters?.to) {
        const toDate = new Date(filters.to).getTime();
        filtered = filtered.filter((m) => m.startTime.getTime() <= toDate);
      }

      if (filtered.length > 0) {
        return filtered;
      }

      return [
        {
          id: 'meet_1',
          calBookingUid: 'cal_uid_1',
          calBookingId: '849201',
          projectId: 'proj_1',
          clientId: 'client_a',
          title: 'Wireframe Review & Architecture Walkthrough',
          status: MeetingStatus.ACCEPTED,
          startTime: new Date('2026-10-21T15:00:00.000Z'),
          endTime: new Date('2026-10-21T15:30:00.000Z'),
          timezone: 'Africa/Lagos',
          project: { id: 'proj_1', name: 'Stephen Showcase Website' },
          client: { id: 'client_a', name: 'Client A', email: 'client_a@example.com' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    const where: any = {};

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.from || filters?.to) {
      where.startTime = {};
      if (filters.from) {
        where.startTime.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.startTime.lte = new Date(filters.to);
      }
    }

    const meetings = await this.prisma.meeting.findMany({
      where,
      orderBy: {
        startTime: 'desc',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (mappedLive.length > 0) {
      const existingUids = new Set(meetings.map((m) => m.calBookingUid));
      for (const item of mappedLive) {
        if (!existingUids.has(item.calBookingUid)) {
          if (!filters?.status || item.status === filters.status) {
            meetings.push(item as any);
          }
        }
      }
    }

    return meetings;
  }

  /**
   * Owner manual meeting update (reassigning project, editing notes).
   */
  async updateMeetingForOwner(meetingId: string, dto: UpdateMeetingDto) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found.');
    }

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
