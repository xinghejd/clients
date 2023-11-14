import { Component, Input } from "@angular/core";

import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import {
  SyncError,
  SyncErrorType,
} from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { Icon, NoItemsModule } from "@bitwarden/components";

import { FailedSync, ServerError, UnableToConnect } from "./icons";

@Component({
  selector: "app-vault-failed-sync-warning",
  templateUrl: "./failed-sync-warning.component.html",
  standalone: true,
  imports: [NoItemsModule],
})
export class FailedSyncWarningComponent {
  private _syncError: SyncError;

  protected icon: Icon = FailedSync;
  protected title: string = this.i18nService.t("syncUnsuccessful");
  protected description: string = this.i18nService.t("unknownSyncErrorDesc");

  @Input()
  set syncError(value: SyncError) {
    this._syncError = value;

    switch (this._syncError?.type) {
      case SyncErrorType.NoNetworkConnection:
        this.icon = UnableToConnect;
        this.title = this.i18nService.t("unableToConnect");
        this.description = this.i18nService.t("noNetworkConnectionDesc");
        break;
      case SyncErrorType.ServerError:
        this.icon = ServerError;
        this.title = this.i18nService.t(
          "serverError",
          (this._syncError.internalError as ErrorResponse).statusCode
        );
        this.description = (this._syncError.internalError as ErrorResponse).message;
        break;
      case SyncErrorType.Unknown:
      default:
        this.icon = FailedSync;
        this.title = this.i18nService.t("syncUnsuccessful");
        this.description = this.i18nService.t("unknownSyncErrorDesc");
        break;
    }
  }

  constructor(private i18nService: I18nService) {}
}
