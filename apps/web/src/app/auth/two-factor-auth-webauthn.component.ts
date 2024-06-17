import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { WINDOW } from "@bitwarden/angular/services/injection-tokens";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { WebAuthnIFrame } from "@bitwarden/common/auth/webauthn-iframe";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { TwoFactorAuthBaseComponent } from "./two-factor-auth-base.component";

@Component({
  selector: "app-two-factor-auth-webauthn",
  templateUrl: "two-factor-auth-webauthn.component.html",
})
export class TwoFactorAuthWebAuthnComponent extends TwoFactorAuthBaseComponent {
  @Output() token = new EventEmitter<string>();

  webAuthnReady = false;
  webAuthnNewTab = false;
  webAuthnSupported = false;
  webAuthn: WebAuthnIFrame = null;

  constructor(
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    @Inject(WINDOW) protected win: Window,
    protected environmentService: EnvironmentService,
    protected twoFactorService: TwoFactorService,
  ) {
    super(i18nService);

    this.webAuthnSupported = this.platformUtilsService.supportsWebAuthn(win);
  }

  async ngOnInit(): Promise<void> {
    this.cleanupWebAuthn();

    if (this.win != null && this.webAuthnSupported) {
      const env = await firstValueFrom(this.environmentService.environment$);
      const webVaultUrl = env.getWebVaultUrl();
      this.webAuthn = new WebAuthnIFrame(
        this.win,
        webVaultUrl,
        this.webAuthnNewTab,
        this.platformUtilsService,
        this.i18nService,
        (token: string) => {
          this.token.emit(token);
          // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          // this.submit();
        },
        (error: string) => {
          this.platformUtilsService.showToast("error", this.i18nService.t("errorOccurred"), error);
        },
        (info: string) => {
          if (info === "ready") {
            this.webAuthnReady = true;
          }
        },
      );

      if (!this.webAuthnNewTab) {
        setTimeout(async () => {
          await this.authWebAuthn();
        }, 500);
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanupWebAuthn();
  }

  async authWebAuthn() {
    const providerData = (await this.twoFactorService.getProviders()).get(
      TwoFactorProviderType.WebAuthn,
    );

    if (!this.webAuthnSupported || this.webAuthn == null) {
      return;
    }

    this.webAuthn.init(providerData);
  }

  private cleanupWebAuthn() {
    if (this.webAuthn != null) {
      this.webAuthn.stop();
      this.webAuthn.cleanup();
    }
  }
}
