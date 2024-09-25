import { Injectable } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { from, map, Observable, switchMap } from "rxjs";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { SendType } from "@bitwarden/common/tools/send/enums/send-type";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { SendId } from "@bitwarden/common/types/guid";
import { DialogService, ToastService } from "@bitwarden/components";
import { SendFormConfig, SendFormConfigService, SendFormMode } from "@bitwarden/send-ui";

/**
 * Helper class to parse query parameters for the AddEdit route.
 */
class QueryParams {
  constructor(params: Params) {
    this.sendId = params.sendId;
    this.type = parseInt(params.type, 10);
  }

  /**
   * The ID of the send to edit, empty when it's a new Send
   */
  sendId?: SendId;

  /**
   * The type of send to create.
   */
  type: SendType;
}

export type AddEditQueryParams = Partial<Record<keyof QueryParams, string>>;

/**
 * Service for adding or editing a send item.
 */
@Injectable()
export class SendAddEditService {
  headerText: string;

  /**
   * The configuration for the send form.
   */
  config: SendFormConfig;

  constructor(
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private addEditFormConfigService: SendFormConfigService,
    private sendApiService: SendApiService,
    private toastService: ToastService,
    private dialogService: DialogService,
  ) {}

  deleteSend = async () => {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "deleteSend" },
      content: { key: "deleteSendPermanentConfirmation" },
      type: "warning",
    });

    if (!confirmed) {
      return false;
    }

    try {
      await this.sendApiService.delete(this.config.originalSend?.id);
    } catch (e) {
      this.toastService.showToast({
        variant: "error",
        title: null,
        message: e.message,
      });
      return false;
    }

    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("deletedSend"),
    });

    return true;
  };

  /**
   * Subscribes to the query parameters and builds the configuration and header text.
   */
  subscribeToParams(): Observable<{ config: SendFormConfig; headerText: string }> {
    return this.route.queryParams.pipe(
      map((params) => new QueryParams(params)),
      switchMap((params) => {
        const mode: SendFormMode = params.sendId == null ? "add" : "edit";
        return from(
          this.addEditFormConfigService.buildConfig(mode, params.sendId, params.type),
        ).pipe(
          map((config) => {
            this.config = config;
            return {
              config,
              headerText: this.getHeaderText(config.mode),
            };
          }),
        );
      }),
    );
  }

  /**
   * Gets the header text based on the mode.
   * @param mode The mode of the send form.
   * @returns The header text.
   */
  private getHeaderText(mode: SendFormMode) {
    return this.i18nService.t(
      mode === "edit" || mode === "partial-edit" ? "editSend" : "createSend",
    );
  }
}
