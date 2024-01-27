import { Observable, firstValueFrom, map } from "rxjs";

import { EncString, EncryptedString } from "@bitwarden/common/platform/models/domain/enc-string";
import { ActiveUserState, GlobalState, StateProvider } from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";

import {
  BIOMETRIC_NO_AUTO_PROMPT_TEXT,
  BIOMETRIC_TEXT,
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
  ENCRYPTED_CLIENT_KEY_HALF,
} from "./biometric.state";

export abstract class BiometricStateService {
  encryptedClientKeyHalf$: Observable<EncryptedString | undefined>;
  biometricUnlockEnabled$: Observable<boolean>; // used to be biometricUnlock
  requirePasswordOnStart$: Observable<boolean>;
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;

  biometricText$: Observable<string>;
  biometricNoAutoPromptText$: Observable<string>;

  abstract setEncryptedClientKeyHalf(encryptedKeyHalf: EncString): Promise<void>;
  abstract setDismissedBiometricRequirePasswordOnStartCallout(value: boolean): Promise<void>;
  abstract getRequirePasswordOnStart(userId: UserId): Promise<boolean>;

  abstract setBiometricText(text: string): Promise<void>;
  abstract setNoAutoPromptBiometricsText(text: string): Promise<void>;
}

export class DefaultBiometricStateService implements BiometricStateService {
  private encryptedClientKeyHalfState: ActiveUserState<EncryptedString | undefined>;
  private biometricUnlockEnabledState: ActiveUserState<boolean>;
  private dismissedBiometricRequirePasswordOnStartCalloutState: ActiveUserState<boolean>;

  private biometricTextState: GlobalState<string>;
  private biometricNoAutoPromptTextState: GlobalState<string>;

  encryptedClientKeyHalf$: Observable<EncryptedString | undefined>;
  biometricUnlockEnabled$: Observable<boolean>;
  requirePasswordOnStart$: Observable<boolean>;
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;

  biometricText$: Observable<string>;
  biometricNoAutoPromptText$: Observable<string>;

  constructor(private stateProvider: StateProvider) {
    this.encryptedClientKeyHalfState = this.stateProvider.getActive(ENCRYPTED_CLIENT_KEY_HALF);
    this.biometricUnlockEnabledState = this.stateProvider.getActive(BIOMETRIC_UNLOCK_ENABLED);
    this.dismissedBiometricRequirePasswordOnStartCalloutState = this.stateProvider.getActive(
      DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
    );

    this.biometricTextState = this.stateProvider.getGlobal(BIOMETRIC_TEXT);
    this.biometricNoAutoPromptTextState = this.stateProvider.getGlobal(
      BIOMETRIC_NO_AUTO_PROMPT_TEXT,
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

    this.biometricText$ = this.biometricTextState.state$;
    this.biometricNoAutoPromptText$ = this.biometricNoAutoPromptTextState.state$;
  }

  async setEncryptedClientKeyHalf(encryptedKeyHalf: EncString): Promise<void> {
    await this.encryptedClientKeyHalfState.update(() => encryptedKeyHalf?.encryptedString);
  }

  async setDismissedBiometricRequirePasswordOnStartCallout(value: boolean): Promise<void> {
    await this.dismissedBiometricRequirePasswordOnStartCalloutState.update(() => value);
  }

  async getRequirePasswordOnStart(userId: UserId): Promise<boolean> {
    if (userId == null) {
      return false;
    }
    const state = this.stateProvider.getUser(userId, ENCRYPTED_CLIENT_KEY_HALF);
    return !!(await firstValueFrom(state.state$));
  }

  async setBiometricText(text: string): Promise<void> {
    await this.biometricTextState.update(() => text);
  }

  async setNoAutoPromptBiometricsText(text: string): Promise<void> {
    await this.biometricNoAutoPromptTextState.update(() => text);
  }
}
