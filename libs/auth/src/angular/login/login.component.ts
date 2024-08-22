import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { firstValueFrom, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { LoginEmailServiceAbstraction } from "@bitwarden/auth/common";
import {
  AsyncActionsModule,
  ButtonModule,
  CheckboxModule,
  FormFieldModule,
} from "@bitwarden/components";

import { LoginService } from "./login.service";

@Component({
  standalone: true,
  templateUrl: "./login.component.html",
  imports: [
    AsyncActionsModule,
    ButtonModule,
    CheckboxModule,
    CommonModule,
    FormFieldModule,
    JslibModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class LoginComponentV2 implements OnInit {
  protected formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    rememberEmail: [false],
  });

  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private loginEmailService: LoginEmailServiceAbstraction,
    private loginService: LoginService,
  ) {}

  async ngOnInit(): Promise<void> {
    let paramEmailIsSet = false;

    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (!params) {
        return;
      }

      const qParamsEmail = params.email;

      if (qParamsEmail?.indexOf("@") > -1) {
        this.formGroup.controls.email.setValue(qParamsEmail);
        paramEmailIsSet = true;
      }
    });

    if (!paramEmailIsSet) {
      await this.loadEmailSettings();
    }
  }

  submit = async () => {};

  async validateEmail() {}

  private async loadEmailSettings() {
    // Try to load the email from memory first
    const email = this.loginEmailService.getEmail();
    const rememberEmail = this.loginEmailService.getRememberEmail();

    if (email) {
      this.formGroup.controls.email.setValue(email);
      this.formGroup.controls.rememberEmail.setValue(rememberEmail);
    } else {
      // If there is no email in memory, check for a storedEmail on disk
      const storedEmail = await firstValueFrom(this.loginEmailService.storedEmail$);

      if (storedEmail) {
        this.formGroup.controls.email.setValue(storedEmail);
        this.formGroup.controls.rememberEmail.setValue(true); // If there is a storedEmail, rememberEmail defaults to true
      }
    }
  }
}
