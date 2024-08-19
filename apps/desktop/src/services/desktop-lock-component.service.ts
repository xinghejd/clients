import { inject } from "@angular/core";
import { combineLatest, from, interval, map, Observable, switchMap } from "rxjs";

import {
  BiometricsDisableReason,
  LockComponentService,
  UnlockOptions,
} from "@bitwarden/auth/angular";
import {
  PinServiceAbstraction,
  UserDecryptionOptionsServiceAbstraction,
} from "@bitwarden/auth/common";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { DeviceType } from "@bitwarden/common/enums";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { KeySuffixOptions } from "@bitwarden/common/platform/enums";
import { UserId } from "@bitwarden/common/types/guid";

export class DesktopLockComponentService implements LockComponentService {
  private readonly userDecryptionOptionsService = inject(UserDecryptionOptionsServiceAbstraction);
  private readonly platformUtilsService = inject(PlatformUtilsService);
  private readonly pinService = inject(PinServiceAbstraction);
  private readonly vaultTimeoutSettingsService = inject(VaultTimeoutSettingsService);
  private readonly cryptoService = inject(CryptoService);

  private readonly biometricsPollingIntervalMs = 1000;

  constructor() {}

  getBiometricsError(error: any): string | null {
    return null;
  }

  async isFido2Session(): Promise<boolean> {
    return false;
  }

  async isWindowVisible(): Promise<boolean> {
    return ipc.platform.isWindowVisible();
  }

  getBiometricsUnlockBtnText(): string {
    switch (this.platformUtilsService.getDevice()) {
      case DeviceType.MacOsDesktop:
        return "unlockWithTouchId";
      case DeviceType.WindowsDesktop:
        return "unlockWithWindowsHello";
      case DeviceType.LinuxDesktop:
        return "unlockWithPolkit";
      default:
        throw new Error("Unsupported platform");
    }
  }

  // TODO: remove this once transitioned to getAvailableUnlockOptions$.
  async biometricsEnabled(userId: UserId): Promise<boolean> {
    return await ipc.platform.biometric.enabled(userId);
  }

  private async isBiometricLockSet(userId: UserId): Promise<boolean> {
    const biometricLockSet = await this.vaultTimeoutSettingsService.isBiometricLockSet(userId);
    const hasBiometricEncryptedUserKeyStored = await this.cryptoService.hasUserKeyStored(
      KeySuffixOptions.Biometric,
      userId,
    );
    const platformSupportsSecureStorage = this.platformUtilsService.supportsSecureStorage();

    return (
      biometricLockSet && (hasBiometricEncryptedUserKeyStored || !platformSupportsSecureStorage)
    );
  }

  private async isBiometricsSupportedAndReady(
    userId: UserId,
  ): Promise<{ supportsBiometric: boolean; biometricReady: boolean }> {
    const supportsBiometric = await this.platformUtilsService.supportsBiometric();
    const biometricReady = await ipc.platform.biometric.enabled(userId);
    return { supportsBiometric, biometricReady };
  }

  private biometricsSupportedAndReady$(userId: UserId): Observable<{
    supportsBiometric: boolean;
    biometricReady: boolean;
  }> {
    return interval(this.biometricsPollingIntervalMs).pipe(
      switchMap(() => this.isBiometricsSupportedAndReady(userId)),
    );
  }

  getAvailableUnlockOptions$(userId: UserId): Observable<UnlockOptions> {
    return combineLatest([
      this.biometricsSupportedAndReady$(userId),
      from(this.isBiometricLockSet(userId)),
      this.userDecryptionOptionsService.userDecryptionOptionsById$(userId),
      from(this.pinService.isPinDecryptionAvailable(userId)),
    ]).pipe(
      map(
        ([
          polledBiometricsData,
          isBiometricsLockSet,
          userDecryptionOptions,
          pinDecryptionAvailable,
        ]) => {
          const disableReason = this.getBiometricsDisabledReason(
            polledBiometricsData.supportsBiometric,
            isBiometricsLockSet,
            polledBiometricsData.biometricReady,
          );

          const unlockOpts: UnlockOptions = {
            masterPassword: {
              enabled: userDecryptionOptions.hasMasterPassword,
            },
            pin: {
              enabled: pinDecryptionAvailable,
            },
            biometrics: {
              enabled:
                polledBiometricsData.supportsBiometric &&
                isBiometricsLockSet &&
                polledBiometricsData.biometricReady,
              disableReason: disableReason,
            },
          };

          return unlockOpts;
        },
      ),
    );
  }

  private getBiometricsDisabledReason(
    osSupportsBiometric: boolean,
    biometricLockSet: boolean,
    biometricReady: boolean,
  ): BiometricsDisableReason | null {
    if (!osSupportsBiometric) {
      return BiometricsDisableReason.NotSupportedOnOperatingSystem;
    } else if (!biometricLockSet) {
      return BiometricsDisableReason.EncryptedKeysUnavailable;
    } else if (!biometricReady) {
      return BiometricsDisableReason.SystemBiometricsUnavailable;
    }
    return null;
  }
}
