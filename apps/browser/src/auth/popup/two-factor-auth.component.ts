import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

import { TwoFactorAuthAuthenticatorComponent } from "@bitwarden/angular/auth/components/two-factor-auth/two-factor-auth-authenticator.component";
import { TwoFactorAuthBaseComponent } from "@bitwarden/angular/auth/components/two-factor-auth/two-factor-auth-base.component";
import { TwoFactorAuthComponent as BaseTwoFactorAuthComponent } from "@bitwarden/angular/auth/components/two-factor-auth/two-factor-auth.component";
import { TwoFactorAuthModule } from "@bitwarden/angular/auth/components/two-factor-auth/two-factor-auth.module";
import { TwoFactorOptionsComponent } from "@bitwarden/angular/auth/components/two-factor-auth/two-factor-options.component";
import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import {
  ButtonModule,
  LinkModule,
  TypographyModule,
  FormFieldModule,
  AsyncActionsModule,
  CheckboxModule,
  IconModule,
} from "@bitwarden/components";

import { TwoFactorAuthEmailComponent } from "./two-factor-auth-email.component";

@Component({
  standalone: true,
  templateUrl:
    "../../../../../libs/angular/src/auth/components/two-factor-auth/two-factor-auth.component.html",
  selector: "app-two-factor-auth",
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
    RouterLink,
    TwoFactorAuthBaseComponent,
    TwoFactorOptionsComponent,
    FormFieldModule,
    AsyncActionsModule,
    CheckboxModule,
    ButtonModule,
    LinkModule,
    IconModule,
    TwoFactorAuthEmailComponent,
    TwoFactorAuthAuthenticatorComponent,
    TwoFactorAuthModule,
  ],
  providers: [I18nPipe],
})
export class TwoFactorAuthComponent extends BaseTwoFactorAuthComponent implements OnInit {}
