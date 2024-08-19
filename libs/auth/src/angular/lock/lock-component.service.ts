import { Observable } from "rxjs";

import { UserId } from "@bitwarden/common/types/guid";

export enum BiometricsDisableReason {
  NotSupportedOnOperatingSystem = "NotSupportedOnOperatingSystem",
  EncryptedKeysUnavailable = "BiometricsEncryptedKeysUnavailable",
  SystemBiometricsUnavailable = "SystemBiometricsUnavailable",
}

export type UnlockOptions = {
  masterPassword: {
    enabled: boolean;
  };
  pin: {
    enabled: boolean;
  };
  biometrics: {
    enabled: boolean;
    disableReason: BiometricsDisableReason | null;
  };
};

/**
 * The LockComponentService is a service which allows the single libs/auth LockComponent to delegate all
 * client specific functionality to client specific services implementations of LockComponentService.
 */
export abstract class LockComponentService {
  // Extension
  abstract isFido2Session(): Promise<boolean>;
  abstract getBiometricsError(error: any): string | null;

  // Desktop only
  abstract isWindowVisible(): Promise<boolean>;
  abstract getBiometricsUnlockBtnText(): string;

  // TODO: this will be replaced by getAvailableUnlockOptions$ in the future.
  abstract biometricsEnabled(userId: UserId): Promise<boolean>;

  // Multi client
  abstract getAvailableUnlockOptions$(userId: UserId): Observable<UnlockOptions>;
}
