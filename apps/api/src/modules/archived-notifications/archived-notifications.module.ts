import { forwardRef, Logger, Module } from '@nestjs/common';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { RetryNotification } from '../notifications/entities/retry-notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigService } from '@nestjs/config';
import { ArchivedNotificationsController } from './archived-notifications.controller';
import { ArchivedNotificationsResolver } from './archived-notifications.resolver';
import { ApplicationsModule } from '../applications/applications.module';
import { JwtOrApiKeyGuard } from 'src/common/guards/jwt-or-api-key/jwt-or-api-key.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArchivedNotification, RetryNotification]),
    forwardRef(() => NotificationsModule),
    ApplicationsModule,
  ],
  providers: [
    ArchivedNotificationsService,
    ArchivedNotificationsResolver,
    Logger,
    ConfigService,
    JwtOrApiKeyGuard,
    RolesGuard,
    JwtAuthGuard,
    GqlAuthGuard,
  ],
  exports: [TypeOrmModule, ArchivedNotificationsService],
  controllers: [ArchivedNotificationsController],
})
export class ArchivedNotificationsModule {}
