export abstract class NotificationsService {
  abstract init: () => Promise<void>;
  abstract updateConnection: (sync?: boolean) => Promise<void>;
  abstract reconnectFromActivity: () => Promise<void>;
  abstract disconnectFromInactivity: () => Promise<void>;
}
