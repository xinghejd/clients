import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { first, firstValueFrom, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { LoginEmailServiceAbstraction } from "@bitwarden/auth/common";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { InternalPolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { ClientType } from "@bitwarden/common/enums";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
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

  // Web specific properties
  enforcedPasswordPolicyOptions: MasterPasswordPolicyOptions;
  policies: Policy[];
  showResetPasswordAutoEnrollWarning = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private loginEmailService: LoginEmailServiceAbstraction,
    private loginService: LoginService,
    private logService: LogService,
    private platformUtilsService: PlatformUtilsService,
    private policyApiService: PolicyApiServiceAbstraction,
    private policyService: InternalPolicyService,
    private router: Router,
  ) {
    this.clientType = this.platformUtilsService.getClientType();
  }

  async ngOnInit(): Promise<void> {
    if (this.clientType === ClientType.Web) {
      await this.webOnInit();
    }

    let paramEmailIsSet = false;

    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (!params) {
        return;
      }

      const qParamsEmail = params.email;

      // If there is an email in the query params, set that email as the form field value
      if (qParamsEmail?.indexOf("@") > -1) {
        this.formGroup.controls.email.setValue(qParamsEmail);
        paramEmailIsSet = true;
      }
    });

    // If there is no email in the query params, attempt to load email settings from loginEmailService
    if (!paramEmailIsSet) {
      await this.loadEmailSettings();
    }

    if (this.clientType === ClientType.Web) {
      // If there's an existing org invite, use it to get the password policies
      const orgInvite = await this.loginService.getOrganizationInvite();
      if (orgInvite != null) {
        const { policies, isPolicyAndAutoEnrollEnabled, enforcedPasswordPolicyOptions } =
          await this.loginService.getPasswordPolicies(orgInvite);

        this.policies = policies;
        this.showResetPasswordAutoEnrollWarning = isPolicyAndAutoEnrollEnabled;
        this.enforcedPasswordPolicyOptions = enforcedPasswordPolicyOptions;
      }
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
