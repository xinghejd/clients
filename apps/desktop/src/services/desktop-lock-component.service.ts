import { inject } from "@angular/core";
import { combineLatest, from, map, Observable, of } from "rxjs";

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
import { BiometricsService } from "@bitwarden/common/platform/biometrics/biometric.service";
import { KeySuffixOptions } from "@bitwarden/common/platform/enums";
import { UserId } from "@bitwarden/common/types/guid";

export class DesktopLockComponentService implements LockComponentService {
  private readonly userDecryptionOptionsService = inject(UserDecryptionOptionsServiceAbstraction);
  private readonly platformUtilsService = inject(PlatformUtilsService);
  private readonly biometricsService = inject(BiometricsService);
  private readonly pinService = inject(PinServiceAbstraction);
  private readonly vaultTimeoutSettingsService = inject(VaultTimeoutSettingsService);
  private readonly cryptoService = inject(CryptoService);

  private readonly biometricsPollingIntervalMs = 1000;

  constructor() {}

  getBiometricsError(error: any): string | null {
    return null;
  }

  isFido2Session$(): Observable<boolean> {
    return of(false);
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
    const supportsBiometric = await this.biometricsService.supportsBiometric();
    const biometricReady = await ipc.platform.biometric.enabled(userId);
    return { supportsBiometric, biometricReady };
  }

  getAvailableUnlockOptions$(userId: UserId): Observable<UnlockOptions> {
    return combineLatest([
      from(this.isBiometricsSupportedAndReady(userId)),
      from(this.isBiometricLockSet(userId)),
      this.userDecryptionOptionsService.userDecryptionOptionsById$(userId),
      from(this.pinService.isPinDecryptionAvailable(userId)),
    ]).pipe(
      map(
        ([biometricsData, isBiometricsLockSet, userDecryptionOptions, pinDecryptionAvailable]) => {
          const disableReason = this.getBiometricsDisabledReason(
            biometricsData.supportsBiometric,
            isBiometricsLockSet,
            biometricsData.biometricReady,
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
                biometricsData.supportsBiometric &&
                isBiometricsLockSet &&
                biometricsData.biometricReady,
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
