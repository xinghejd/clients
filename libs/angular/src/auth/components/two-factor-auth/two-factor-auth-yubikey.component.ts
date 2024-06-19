import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import {
  ButtonModule,
  LinkModule,
  TypographyModule,
  FormFieldModule,
  AsyncActionsModule,
} from "@bitwarden/components";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  standalone: true,
  selector: "app-two-factor-auth-yubikey",
  templateUrl: "two-factor-auth-yubikey.component.html",
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
export class TwoFactorAuthYubikeyComponent extends TwoFactorAuthBaseComponent {
  tokenValue: string = "";
  @Output() token = new EventEmitter<string>();

  constructor(i18nService: I18nService) {
    super(i18nService);
  }

  async ngOnInit(): Promise<void> {
    this.activeButtonTextChange.emit(this.i18nService.t("continue"));
  }
}
