import { Observable, map } from "rxjs";

import { EncString, EncryptedString } from "@bitwarden/common/platform/models/domain/enc-string";
import { ActiveUserState, ActiveUserStateProvider } from "@bitwarden/common/platform/state";

import {
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
  ENCRYPTED_CLIENT_KEY_HALF,
} from "./biometric.state";

export abstract class BiometricStateService {
  encryptedClientKeyHalf$: Observable<EncryptedString | undefined>;
  biometricUnlockEnabled$: Observable<boolean>; // used to be biometricUnlock
  requirePasswordOnStart$: Observable<boolean>;
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;

  abstract setEncryptedClientKeyHalf(encryptedKeyHalf: EncString): Promise<void>;
  abstract setDismissedBiometricRequirePasswordOnStartCallout(value: boolean): Promise<void>;
}

export class DefaultBiometricStateService implements BiometricStateService {
  private encryptedClientKeyHalfState: ActiveUserState<EncryptedString | undefined>;
  private biometricUnlockEnabledState: ActiveUserState<boolean>;
  private dismissedBiometricRequirePasswordOnStartCalloutState: ActiveUserState<boolean>;

  encryptedClientKeyHalf$: Observable<EncryptedString | undefined>;
  biometricUnlockEnabled$: Observable<boolean>;
  requirePasswordOnStart$: Observable<boolean>;
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;

  constructor(private activeUserStateProvider: ActiveUserStateProvider) {
    this.encryptedClientKeyHalfState = this.activeUserStateProvider.get(ENCRYPTED_CLIENT_KEY_HALF);
    this.biometricUnlockEnabledState = this.activeUserStateProvider.get(BIOMETRIC_UNLOCK_ENABLED);
    this.dismissedBiometricRequirePasswordOnStartCalloutState = this.activeUserStateProvider.get(
      DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
    );

    this.encryptedClientKeyHalf$ = this.encryptedClientKeyHalfState.state$;
    this.requirePasswordOnStart$ = this.encryptedClientKeyHalf$.pipe(map((keyHalf) => !!keyHalf));
    this.biometricUnlockEnabled$ = this.biometricUnlockEnabledState.state$.pipe(
      map((enabled) => !!enabled),
    );
    this.dismissedBiometricRequirePasswordOnStartCallout$ =
      this.dismissedBiometricRequirePasswordOnStartCalloutState.state$.pipe(
        map((dismissed) => !!dismissed),
      );
  }

  async setEncryptedClientKeyHalf(encryptedKeyHalf: EncString): Promise<void> {
    await this.encryptedClientKeyHalfState.update(() => encryptedKeyHalf?.encryptedString);
  }

  async setDismissedBiometricRequirePasswordOnStartCallout(value: boolean): Promise<void> {
    await this.dismissedBiometricRequirePasswordOnStartCalloutState.update(() => value);
  }
}
