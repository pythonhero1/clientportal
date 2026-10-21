import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { UsersModule } from './users/users.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { FilesModule } from './files/files.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { MeetingsModule } from './meetings/meetings.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { SupportModule } from './support/support.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    UsersModule,
    WebhooksModule,
    FilesModule,
    MessagesModule,
    InvoicesModule,
    MeetingsModule,
    CalendarModule,
    NotificationsModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
