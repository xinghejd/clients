import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, concatMap, firstValueFrom, map, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { VaultTimeoutService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { VaultTimeoutAction } from "@bitwarden/common/enums/vault-timeout-action.enum";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { KeySuffixOptions } from "@bitwarden/common/platform/enums";
import { UserId } from "@bitwarden/common/types/guid";
import { AsyncActionsModule, ButtonModule, FormFieldModule } from "@bitwarden/components";

import { PinLockType, PinService } from "../../common";

@Component({
  selector: "bit-lock",
  templateUrl: "lock.component.html",
  standalone: true,
  imports: [CommonModule, JslibModule, ButtonModule, FormFieldModule, AsyncActionsModule],
})
export class LockV2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  private activeUserId: UserId;

  pinEnabled = false;
  masterPasswordEnabled = false;
  supportsBiometric: boolean;
  biometricLock: boolean;

  email: string;

  webVaultHostname = "";

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private vaultTimeoutService: VaultTimeoutService,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    private pinService: PinService,
    private userVerificationService: UserVerificationService,
    private cryptoService: CryptoService,
    private platformUtilsService: PlatformUtilsService,
    private environmentService: EnvironmentService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.accountService.activeAccount$
      .pipe(
        // TODO: eval if concatMap is the right operator here; what about switchMap?
        // Does order of processing matter here?
        concatMap(async (account) => {
          // TODO: it will be cleaner to just load the active account
          this.activeUserId = account?.id;
          await this.load(account?.id);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private async load(userId: UserId) {
    // TODO: how much of this should be in a guard?
    // TODO: Investigate PM-3515

    // The loading of the lock component works as follows:
    //   1. If the user is unlocked, we're here in error so we navigate to the home page
    //   2. First, is locking a valid timeout action?  If not, we will log the user out.
    //   3. If locking IS a valid timeout action, we proceed to show the user the lock screen.
    //      The user will be able to unlock as follows:
    //        - If they have a PIN set, they will be presented with the PIN input
    //        - If they have a master password and no PIN, they will be presented with the master password input
    //        - If they have biometrics enabled, they will be presented with the biometric prompt

    const isUnlocked = await firstValueFrom(
      this.authService
        .authStatusFor$(userId)
        .pipe(map((status) => status === AuthenticationStatus.Unlocked)),
    );
    if (isUnlocked) {
      // navigate to home
      await this.router.navigate(["/"]);
      return;
    }

    // shouldn't all of this be in a service as well?
    // So much of this seems like it has cross over with user verification

    const availableVaultTimeoutActions = await firstValueFrom(
      this.vaultTimeoutSettingsService.availableVaultTimeoutActions$(userId),
    );
    const supportsLock = availableVaultTimeoutActions.includes(VaultTimeoutAction.Lock);
    if (!supportsLock) {
      return await this.vaultTimeoutService.logOut(userId);
    }

    const pinLockType: PinLockType = await this.pinService.getPinLockType(userId);
    const ephemeralPinSet = await this.pinService.getPinKeyEncryptedUserKeyEphemeral(userId);
    this.pinEnabled =
      (pinLockType === "EPHEMERAL" && !!ephemeralPinSet) || pinLockType === "PERSISTENT";

    this.masterPasswordEnabled = await this.userVerificationService.hasMasterPassword();

    this.supportsBiometric = await this.platformUtilsService.supportsBiometric();
    this.biometricLock =
      (await this.vaultTimeoutSettingsService.isBiometricLockSet()) &&
      ((await this.cryptoService.hasUserKeyStored(KeySuffixOptions.Biometric)) ||
        !this.platformUtilsService.supportsSecureStorage());

    this.email = await firstValueFrom(
      this.accountService.activeAccount$.pipe(map((a) => a?.email)),
    );

    this.webVaultHostname = (await this.environmentService.getEnvironment()).getHostname();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
