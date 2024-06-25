import { MessageListener, MessageSender } from "@bitwarden/common/platform/messaging";
import { NotificationsService } from "@bitwarden/common/platform/notifications";

export class NotificationsServiceListener {
  constructor(
    private readonly messageListener: MessageListener,
    private readonly messageSender: MessageSender,
    private readonly notificationsService: NotificationsService,
  ) {}

  createListener$() {}
}
