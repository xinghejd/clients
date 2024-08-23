import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { first, firstValueFrom, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { LoginEmailServiceAbstraction } from "@bitwarden/auth/common";
import { ClientType } from "@bitwarden/common/enums";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
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
  clientType: ClientType;

  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    rememberEmail: [false],
  });

  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private loginEmailService: LoginEmailServiceAbstraction,
    private loginService: LoginService,
    private platformUtilsService: PlatformUtilsService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.clientType = this.platformUtilsService.getClientType();

    if (this.clientType === ClientType.Web) {
      await this.webOnInit();
    }

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
    // If there's an existing org invite, use it to get the password policies
    await this.loginService.handleExistingOrgInvite();
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

  private async webOnInit(): Promise<void> {
    this.activatedRoute.queryParams.pipe(first(), takeUntil(this.destroy$)).subscribe((qParams) => {
      // If there is an query parameter called 'org', set previousUrl to `/create-organization?org=paramValue`
      if (qParams.org != null) {
        const route = this.router.createUrlTree(["create-organization"], {
          queryParams: { plan: qParams.org },
        });
        this.loginService.setPreviousUrl(route);
      }

      /**
       * If there is a query parameter called 'sponsorshipToken', that means they are coming
       * from an email for sponsoring a families organization. If so, then set the prevousUrl
       * to `/setup/families-for-enterprise?token=paramValue`
       */
      if (qParams.sponsorshipToken != null) {
        const route = this.router.createUrlTree(["setup/families-for-enterprise"], {
          queryParams: { token: qParams.sponsorshipToken },
        });
        this.loginService.setPreviousUrl(route);
      }
    });
  }
}
