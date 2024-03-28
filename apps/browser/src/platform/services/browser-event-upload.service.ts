import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { EventUploadService } from "@bitwarden/common/services/event/event-upload.service";

import { AlarmsManagerService } from "../browser/alarms-manager.service";

export class BrowserEventUploadService extends EventUploadService {
  private eventUploadsAlarmName = "browser-event-uploads-interval-alarm";

  constructor(
    apiService: ApiService,
    stateProvider: StateProvider,
    logService: LogService,
    accountService: AccountService,
    private alarmsManagerService: AlarmsManagerService,
  ) {
    super(apiService, stateProvider, logService, accountService);
  }

  protected setupEventUploadsInterval = () => {
    const intervalDurationInSeconds = this.uploadEventsIntervalDurationInMs / 1000;
    this.alarmsManagerService
      .setIntervalAlarm(
        this.eventUploadsAlarmName,
        () => this.uploadEvents(),
        intervalDurationInSeconds / 60,
      )
      .catch((error) =>
        this.logService.error(`Failed to set event upload interval alarm: ${error}`),
      );
  };
}
