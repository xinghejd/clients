import { Subscription } from "rxjs";

import { NotificationResponse } from "../../models/response/notification.response";
import { UserId } from "../../types/guid";

export type Notification = {
  /**
   * The user id for which this notification corresponds to.
   */
  userId: UserId;

  /**
   * The data of the notification.
   */
  data: NotificationResponse;
};

/**
 *
 */
export abstract class NotificationsService {
  /**
   *
   */
  abstract start(): Subscription;
  /**
   *
   */
  abstract reconnectFromActivity(): void;
  /**
   *
   */
  abstract disconnectFromInactivity(): void;
}
