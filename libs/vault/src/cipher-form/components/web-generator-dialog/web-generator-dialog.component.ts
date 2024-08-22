import { animate, group, style, transition, trigger } from "@angular/animations";
import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ButtonModule, DialogService } from "@bitwarden/components";
import { CipherFormGeneratorComponent } from "@bitwarden/vault";

import { DialogModule } from "../../../../../../libs/components/src/dialog";

export interface WebVaultGeneratorDialogParams {
  type: "password" | "username";
}

export interface WebVaultGeneratorDialogResult {
  action: WebVaultGeneratorDialogAction;
  generatedValue?: string;
}

export enum WebVaultGeneratorDialogAction {
  Selected = "selected",
  Canceled = "canceled",
}

const slideIn = trigger("slideIn", [
  transition(":enter", [
    style({ opacity: 0, transform: "translateY(100vh)" }),
    group([
      animate("0.15s linear", style({ opacity: 1 })),
      animate("0.3s ease-out", style({ transform: "none" })),
    ]),
  ]),
]);

@Component({
  selector: "web-vault-generator-dialog",
  templateUrl: "./web-generator-dialog.component.html",
  standalone: true,
  imports: [CommonModule, CipherFormGeneratorComponent, ButtonModule, DialogModule],
  animations: [slideIn],
})
export class WebVaultGeneratorDialogComponent {
  protected title = this.i18nService.t(this.isPassword ? "passwordGenerator" : "usernameGenerator");
  protected selectButtonText = this.i18nService.t(
    this.isPassword ? "useThisPassword" : "useThisUsername",
  );

  /**
   * Whether the dialog is generating a password/passphrase. If false, it is generating a username.
   * @protected
   */
  protected get isPassword() {
    return this.params.type === "password";
  }

  /**
   * The currently generated value.
   * @protected
   */
  protected generatedValue: string = "";

  constructor(
    @Inject(DIALOG_DATA) protected params: WebVaultGeneratorDialogParams,
    private dialogRef: DialogRef<WebVaultGeneratorDialogResult>,
    private i18nService: I18nService,
  ) {}

  /**
   * Close the dialog without selecting a value.
   */
  protected close = () => {
    this.dialogRef.close({ action: WebVaultGeneratorDialogAction.Canceled });
  };

  /**
   * Close the dialog and select the currently generated value.
   */
  protected selectValue = () => {
    this.dialogRef.close({
      action: WebVaultGeneratorDialogAction.Selected,
      generatedValue: this.generatedValue,
    });
  };

  onValueGenerated(value: string) {
    this.generatedValue = value;
  }

  /**
   * Opens the vault generator dialog in a full screen dialog.
   */
  static open(dialogService: DialogService, config: DialogConfig<WebVaultGeneratorDialogParams>) {
    return dialogService.open<WebVaultGeneratorDialogResult, WebVaultGeneratorDialogParams>(
      WebVaultGeneratorDialogComponent,
      {
        ...config,
      },
    );
  }
}
