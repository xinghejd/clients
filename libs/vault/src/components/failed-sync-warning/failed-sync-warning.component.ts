import { Component, Input } from "@angular/core";

import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { isNetworkError } from "@bitwarden/common/vault/misc/utils";
import { SyncError } from "@bitwarden/common/vault/types/sync-event-args";
import { Icon, NoItemsModule } from "@bitwarden/components";

import { FailedSync, ServerError, UnableToConnect } from "./icons";

@Component({
  selector: "app-vault-failed-sync-warning",
  templateUrl: "./failed-sync-warning.component.html",
  standalone: true,
  imports: [NoItemsModule],
})
export class FailedSyncWarningComponent {
  protected icon: Icon = FailedSync;
  protected title: string = this.i18nService.t("syncUnsuccessful");
  protected description: string = this.i18nService.t("unknownSyncErrorDesc");

  @Input()
  set syncError(error: SyncError) {
    if (error instanceof ErrorResponse) {
      this.icon = ServerError;
      this.title = this.i18nService.t("serverError", error.statusCode);
      this.description = error.message ? error.message : this.description;
    } else if (isNetworkError(error)) {
      this.icon = UnableToConnect;
      this.title = this.i18nService.t("unableToConnect");
      this.description = this.i18nService.t("noNetworkConnectionDesc");
    } else {
      this.icon = FailedSync;
      this.title = this.i18nService.t("syncUnsuccessful");
      this.description = this.i18nService.t("unknownSyncErrorDesc");
    }
  }

  constructor(private i18nService: I18nService) {}
}
