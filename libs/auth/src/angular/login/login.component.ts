import { CommonModule } from "@angular/common";
import { Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { first, firstValueFrom, Subject, take, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  LoginEmailServiceAbstraction,
  LoginStrategyServiceAbstraction,
  PasswordLoginCredentials,
  RegisterRouteService,
} from "@bitwarden/auth/common";
import { InternalPolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyData } from "@bitwarden/common/admin-console/models/data/policy.data";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { CaptchaIFrame } from "@bitwarden/common/auth/captcha-iframe";
import { ForceSetPasswordReason } from "@bitwarden/common/auth/models/domain/force-set-password-reason";
import { ClientType } from "@bitwarden/common/enums";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { UserId } from "@bitwarden/common/types/guid";
import {
  AsyncActionsModule,
  ButtonModule,
  CheckboxModule,
  FormFieldModule,
  ToastService,
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
  @Input() captchaSiteKey: string = null;

  private destroy$ = new Subject<void>();

  captcha: CaptchaIFrame;
  captchaToken: string = null;
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
    private environmentService: EnvironmentService,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    private loginEmailService: LoginEmailServiceAbstraction,
    private loginService: LoginService,
    private loginStrategyService: LoginStrategyServiceAbstraction,
    private ngZone: NgZone,
    private passwordStrengthService: PasswordStrengthServiceAbstraction,
    private platformUtilsService: PlatformUtilsService,
    private policyService: InternalPolicyService,
    private registerRouteService: RegisterRouteService,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.clientType = this.platformUtilsService.getClientType();
    this.showPasswordless = this.loginService.getShowPasswordlessFlag();
  }

  async ngOnInit(): Promise<void> {
    if (this.clientType === ClientType.Web) {
      await this.webOnInit();
    }

    await this.defaultOnInit();

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

  submit = async (showToast: boolean): Promise<void> => {
    const data = this.formGroup.value;

    await this.setupCaptcha();

    this.formGroup.markAllAsTouched();

    // Web specific (start)
    if (this.formGroup.invalid && !showToast) {
      return;
    }
    // Web specific (end)

    const credentials = new PasswordLoginCredentials(
      data.email,
      data.masterPassword,
      this.captchaToken,
      null,
    );

    const response = await this.loginStrategyService.logIn(credentials);

    await this.saveEmailSettings();

    if (this.handleCaptchaRequired(response)) {
      return;
    } else if (await this.loginService.handleMigrateEncryptionKey(response)) {
      return;
    } else if (response.requiresTwoFactor) {
      await this.router.navigate(["2fa"]);
    } else if (response.forcePasswordReset != ForceSetPasswordReason.None) {
      this.loginEmailService.clearValues();
      await this.router.navigate(["update-temp-password"]);
    } else {
      // Web specific (start)
      await this.goAfterLogIn(response.userId);
      // Web specific (end)
    }
  };

  protected async goAfterLogIn(userId: UserId) {
    const masterPassword = this.formGroup.value.masterPassword;

    // Check master password against policy
    if (this.enforcedPasswordPolicyOptions != null) {
      const strengthResult = this.passwordStrengthService.getPasswordStrength(
        masterPassword,
        this.formGroup.value.email,
      );
      const masterPasswordScore = strengthResult == null ? null : strengthResult.score;

      // If invalid, save policies and require update
      if (
        !this.policyService.evaluateMasterPassword(
          masterPasswordScore,
          masterPassword,
          this.enforcedPasswordPolicyOptions,
        )
      ) {
        const policiesData: { [id: string]: PolicyData } = {};
        this.policies.map((p) => (policiesData[p.id] = PolicyData.fromPolicy(p)));
        await this.policyService.replace(policiesData, userId);
        await this.router.navigate(["update-password"]);
        return;
      }
    }

    this.loginEmailService.clearValues();
    await this.router.navigate(["vault"]);
  }

  protected async setupCaptcha() {
    const env = await firstValueFrom(this.environmentService.environment$);
    const webVaultUrl = env.getWebVaultUrl();

    this.captcha = new CaptchaIFrame(
      window,
      webVaultUrl,
      this.i18nService,
      (token: string) => {
        this.captchaToken = token;
      },
      (error: string) => {
        this.toastService.showToast({
          variant: "error",
          title: this.i18nService.t("errorOccurred"),
          message: error,
        });
      },
      (info: string) => {
        this.toastService.showToast({
          variant: "info",
          title: this.i18nService.t("info"),
          message: info,
        });
      },
    );
  }

  protected showCaptcha() {
    return !Utils.isNullOrWhitespace(this.captchaSiteKey);
  }

  protected handleCaptchaRequired(response: { captchaSiteKey: string }): boolean {
    if (Utils.isNullOrWhitespace(response.captchaSiteKey)) {
      return false;
    }

    this.captchaSiteKey = response.captchaSiteKey;
    this.captcha.init(response.captchaSiteKey);
    return true;
  }

  protected async startAuthRequestLogin() {
    this.formGroup.get("masterPassword")?.clearValidators();
    this.formGroup.get("masterPassword")?.updateValueAndValidity();

    if (!this.formGroup.valid) {
      return;
    }

    await this.saveEmailSettings();
    await this.router.navigate(["/login-with-device"]);
  }

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
    this.loginEmailService.setLoginEmail(this.formGroup.value.email);
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
    const email = await firstValueFrom(this.loginEmailService.loginEmail$);
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

  private async defaultOnInit(): Promise<void> {
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
  }

  private async webOnInit(): Promise<void> {
    this.activatedRoute.queryParams.pipe(first(), takeUntil(this.destroy$)).subscribe((qParams) => {
      // If there is a parameter called 'org', set previousUrl to `/create-organization?org=<paramValue>`
      if (qParams.org != null) {
        const route = this.router.createUrlTree(["create-organization"], {
          queryParams: { plan: qParams.org },
        });
        this.loginService.setPreviousUrl(route);
      }

      /**
       * If there is a parameter called 'sponsorshipToken', they are coming from an email for sponsoring a families organization.
       * Therefore set the prevousUrl to `/setup/families-for-enterprise?token=<paramValue>`
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
