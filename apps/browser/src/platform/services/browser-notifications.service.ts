import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { NotificationsService } from "@bitwarden/common/services/notifications.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

import { AlarmsManagerService } from "../browser/abstractions/alarms-manager.service";

export class BrowserNotificationsService extends NotificationsService {
  private reconnectTimerAlarmName = "browser-reconnect-timer";

  constructor(
    logService: LogService,
    syncService: SyncService,
    appIdService: AppIdService,
    apiService: ApiService,
    environmentService: EnvironmentService,
    logoutCallback: (expired: boolean) => Promise<void>,
    stateService: StateService,
    authService: AuthService,
    messagingService: MessagingService,
    private alarmsManagerService: AlarmsManagerService,
  ) {
    super(
      logService,
      syncService,
      appIdService,
      apiService,
      environmentService,
      logoutCallback,
      stateService,
      authService,
      messagingService,
    );
  }

  protected setupReconnectTimer = (shouldSync: boolean, timeoutInMs: number) => {
    const timeoutInSeconds = timeoutInMs / 1000;
    this.alarmsManagerService
      .setTimeoutAlarm(
        this.reconnectTimerAlarmName,
        () => this.reconnect(shouldSync),
        timeoutInSeconds / 60,
      )
      .catch((error) => this.logService.error(`Failed to set reconnect timer alarm: ${error}`));
  };

  protected clearReconnectTimer = () => {
    this.alarmsManagerService
      .clearAlarm(this.reconnectTimerAlarmName)
      .catch((error) => this.logService.error(`Failed to clear reconnect timer alarm: ${error}`));
  };
}
