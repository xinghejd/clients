import { CommonModule } from "@angular/common";
import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { first, firstValueFrom, Subject, take, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { LoginEmailServiceAbstraction, RegisterRouteService } from "@bitwarden/auth/common";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { ClientType } from "@bitwarden/common/enums";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
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
export class LoginComponentV2 implements OnInit, OnDestroy {
  @ViewChild("masterPasswordInput", { static: true }) masterPasswordInput: ElementRef;

  private destroy$ = new Subject<void>();

  clientType: ClientType;
  registerRoute$ = this.registerRouteService.registerRoute$(); // TODO: remove when email verification flag is removed
  showLoginWithDevice = false;
  validatedEmail = false;

  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    masterPassword: [
      "",
      [Validators.required, Validators.minLength(Utils.originalMinimumPasswordLength)],
    ],
    rememberEmail: [false],
  });

  get emailFormControl() {
    return this.formGroup.controls.email;
  }

  get loggedEmail() {
    return this.formGroup.value.email;
  }

  // Web specific properties
  enforcedPasswordPolicyOptions: MasterPasswordPolicyOptions;
  policies: Policy[];
  showPasswordless = false;
  showResetPasswordAutoEnrollWarning = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appIdService: AppIdService,
    private devicesApiService: DevicesApiServiceAbstraction,
    private formBuilder: FormBuilder,
    private loginEmailService: LoginEmailServiceAbstraction,
    private loginService: LoginService,
    private ngZone: NgZone,
    private platformUtilsService: PlatformUtilsService,
    private registerRouteService: RegisterRouteService,
    private router: Router,
  ) {
    this.clientType = this.platformUtilsService.getClientType();
    this.showPasswordless = this.loginService.getShowPasswordlessFlag();
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
      const { policies, isPolicyAndAutoEnrollEnabled, enforcedPasswordPolicyOptions } =
        await this.loginService.getOrgPolicies();

      this.policies = policies;
      this.showResetPasswordAutoEnrollWarning = isPolicyAndAutoEnrollEnabled;
      this.enforcedPasswordPolicyOptions = enforcedPasswordPolicyOptions;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit = async () => {};

  protected async validateEmail(): Promise<void> {
    this.formGroup.controls.email.markAsTouched();
    const emailValid = this.formGroup.controls.email.valid;

    if (emailValid) {
      this.toggleValidateEmail(true);
      await this.getLoginWithDevice(this.loggedEmail);
    }
  }

  protected toggleValidateEmail(value: boolean): void {
    this.validatedEmail = value;

    if (!this.validatedEmail) {
      // Reset master password only when going from validated to not validated so that autofill can work properly
      this.formGroup.controls.masterPassword.reset();
    } else {
      // Mark MP as untouched so that, when users enter email and hit enter, the MP field doesn't load with validation errors
      this.formGroup.controls.masterPassword.markAsUntouched();

      // When email is validated, focus on master password after waiting for input to be rendered
      if (this.ngZone.isStable) {
        this.masterPasswordInput?.nativeElement?.focus();
      } else {
        this.ngZone.onStable.pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
          this.masterPasswordInput?.nativeElement?.focus();
        });
      }
    }
  }

  protected async goToHint() {
    await this.saveEmailSettings();
    await this.router.navigateByUrl("/hint");
  }

  protected async goToRegister() {
    // TODO: remove when email verification flag is removed
    const registerRoute = await firstValueFrom(this.registerRoute$);

    if (this.emailFormControl.valid) {
      await this.router.navigate([registerRoute], {
        queryParams: { email: this.emailFormControl.value },
      });
      return;
    }

    await this.router.navigate([registerRoute]);
  }

  protected async saveEmailSettings() {
    this.loginEmailService.setEmail(this.formGroup.value.email);
    this.loginEmailService.setRememberEmail(this.formGroup.value.rememberEmail);
    await this.loginEmailService.saveEmailSettings();
  }

  private async getLoginWithDevice(email: string): Promise<void> {
    try {
      const deviceIdentifier = await this.appIdService.getAppId();
      this.showLoginWithDevice = await this.devicesApiService.getKnownDevice(
        email,
        deviceIdentifier,
      );
    } catch (e) {
      this.showLoginWithDevice = false;
    }
  }

  private async loadEmailSettings(): Promise<void> {
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
