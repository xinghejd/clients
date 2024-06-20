import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

import { TwoFactorAuthDuoComponent as TwoFactorAuthDuoBaseComponent } from "@bitwarden/angular/auth/components/two-factor-auth/two-factor-auth-duo.component";
import { JslibModule } from "@bitwarden/angular/jslib.module";

import { AsyncActionsModule } from "../../../../../libs/components/src/async-actions";
import { ButtonModule } from "../../../../../libs/components/src/button";
import { FormFieldModule } from "../../../../../libs/components/src/form-field";
import { LinkModule } from "../../../../../libs/components/src/link";
import { I18nPipe } from "../../../../../libs/components/src/shared/i18n.pipe";
import { TypographyModule } from "../../../../../libs/components/src/typography";

@Component({
  standalone: true,
  selector: "app-two-factor-auth-duo",
  templateUrl:
    "../../../../../libs/angular/src/auth/components/two-factor-auth/two-factor-auth-duo.component.html",
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
export class TwoFactorAuthDuoComponent extends TwoFactorAuthDuoBaseComponent {
  async ngOnInit(): Promise<void> {
    await super.ngOnInit();
  }
}
