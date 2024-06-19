import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import {
  ButtonModule,
  LinkModule,
  TypographyModule,
  FormFieldModule,
  AsyncActionsModule,
} from "@bitwarden/components";

import { TwoFactorAuthDuoComponent } from "./two-factor-auth-duo.component";
import { TwoFactorAuthWebAuthnComponent } from "./two-factor-auth-webauthn.component";
import { TwoFactorAuthYubikeyComponent } from "./two-factor-auth-yubikey.component";

@NgModule({
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
  declarations: [
    TwoFactorAuthDuoComponent,
    TwoFactorAuthWebAuthnComponent,
    TwoFactorAuthYubikeyComponent,
  ],
  exports: [
    TwoFactorAuthDuoComponent,
    TwoFactorAuthWebAuthnComponent,
    TwoFactorAuthYubikeyComponent,
  ],
})
export class TwoFactorAuthModule {}
