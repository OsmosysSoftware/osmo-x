import { Process, Processor } from "@nestjs/bull";
import { NotificationConsumer } from "./notification.consumer";
import { SMS_KAPSYSTEM_QUEUE } from "src/modules/notifications/queues/smsKapsystem.queue";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KapsystemData, SmsKapsystemService } from "src/modules/providers/sms-kapsystem/sms-kapsystem.service";
import { NotificationsService } from "src/modules/notifications/notifications.service";
import { Notification } from "src/modules/notifications/entities/notification.entity";
import { Job } from "bull";

@Processor(SMS_KAPSYSTEM_QUEUE)
export class KapsystemNotificationsConsumer extends NotificationConsumer {
    constructor(
        @InjectRepository(Notification)
        protected readonly notificationRepository: Repository<Notification>,
        private readonly kapsystemService: SmsKapsystemService,
        notificationsService: NotificationsService,
    ) {
        super(notificationRepository, notificationsService)
    }

    @Process()
    async processKapsystemNotificationQueue(job: Job<number>): Promise<void> {
        return super.processNotificationQueue(job, async () => {
            const id = job.data;
            const notification = (await this.notificationsService.getNotificationById(id))[0];
            return this.kapsystemService.sendMessage(
                notification.data as unknown as KapsystemData,
                notification.providerId,
            );
        });
    }
}