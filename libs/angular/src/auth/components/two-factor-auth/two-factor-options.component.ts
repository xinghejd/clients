import { DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
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
export class TwoFactorOptionsComponent implements OnInit {
  @Output() onProviderSelected = new EventEmitter<TwoFactorProviderType>();
  @Output() onRecoverSelected = new EventEmitter();

  providers: any[] = [];
  platformUtilsService: any;

  constructor(
    private twoFactorService: TwoFactorService,
    private environmentService: EnvironmentService,
    private dialogRef: DialogRef,
  ) {}

  async ngOnInit() {
    this.providers = await this.twoFactorService.getSupportedProviders(window);
  }

  async choose(p: any) {
    this.onProviderSelected.emit(p.type);
    this.dialogRef.close({ result: TwoFactorOptionsDialogResult.Provider, type: p.type });
  }

  async recover() {
    const env = await firstValueFrom(this.environmentService.environment$);
    const webVault = env.getWebVaultUrl();
    this.platformUtilsService.launchUri(webVault + "/#/recover-2fa");
    this.onRecoverSelected.emit();
    this.dialogRef.close({ result: TwoFactorOptionsDialogResult.Recover });
  }

  static open(dialogService: DialogService) {
    return dialogService.open<TwoFactorOptionsDialogResultType>(TwoFactorOptionsComponent);
  }
}
