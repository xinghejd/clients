import { DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { TwoFactorOptionsComponent as BaseTwoFactorOptionsComponent } from "@bitwarden/angular/auth/components/two-factor-options.component";
import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AsyncActionsModule,
  ButtonModule,
  DialogModule,
  DialogService,
  FormFieldModule,
  LinkModule,
  TypographyModule,
} from "@bitwarden/components";

export enum TwoFactorOptionsDialogResult {
  Provider = "Provider selected",
  Recover = "Recover selected",
}

export type TwoFactorOptionsDialogResultType = {
  result: TwoFactorOptionsDialogResult;
  type: TwoFactorProviderType;
};

@Component({
  standalone: true,
  selector: "app-two-factor-options",
  templateUrl: "two-factor-options.component.html",
  imports: [
    CommonModule,
    JslibModule,
    DialogModule,
    ButtonModule,
    LinkModule,
    TypographyModule,
    ReactiveFormsModule,
    FormFieldModule,
    AsyncActionsModule,
    FormsModule,
  ],
  providers: [I18nPipe],
})
export class TwoFactorOptionsComponent extends BaseTwoFactorOptionsComponent {
  constructor(
    twoFactorService: TwoFactorService,
    router: Router,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    environmentService: EnvironmentService,
    private dialogRef: DialogRef,
  ) {
    super(twoFactorService, router, i18nService, platformUtilsService, window, environmentService);
  }

  async choose(p: any) {
    await super.choose(p);
    this.dialogRef.close({ result: TwoFactorOptionsDialogResult.Provider, type: p.type });
  }

  async recover() {
    await super.recover();
    this.dialogRef.close({ result: TwoFactorOptionsDialogResult.Recover });
  }

  static open(dialogService: DialogService) {
    return dialogService.open<TwoFactorOptionsDialogResultType>(TwoFactorOptionsComponent);
  }
}
