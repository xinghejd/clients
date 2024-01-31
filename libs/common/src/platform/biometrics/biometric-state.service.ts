import { Observable, firstValueFrom, map } from "rxjs";

import { UserId } from "../../types/guid";
import { EncryptedString, EncString } from "../models/domain/enc-string";
import { ActiveUserState, GlobalState, StateProvider } from "../state";

import {
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT,
  ENCRYPTED_CLIENT_KEY_HALF,
  FINGERPRINT_VALIDATED,
  PROMPT_CANCELLED,
  PROMPT_AUTOMATICALLY,
} from "./biometric.state";

export abstract class BiometricStateService {
  /**
   * If the user has elected to require a password on first unlock of an application instance, this key will store the
   * encrypted client key half used to unlock the vault.
   *
   * Tracks the currently active user
   */
  encryptedClientKeyHalf$: Observable<EncString | undefined>;
  /**
   * Whether the currently active user has elected to store a biometric key to unlock their vault.
   */
  biometricUnlockEnabled$: Observable<boolean>; // used to be biometricUnlock
  /**
   * whether or not a password is required on first unlock after opening the application
   *
   * tracks the currently active user
   */
  requirePasswordOnStart$: Observable<boolean>;
  /**
   * Indicates the user has been warned about the security implications of using biometrics and, depending on the OS,
   *
   * tracks the currently active user.
   */
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;
  /**
   * TODO: move to memory? if I do, remove initialization in `nativeMessaging.background` constructor
   * TODO: verify this
   * Whether the browser fingerprint has been validated this session.
   *
   * globally scoped
   */
  fingerprintValidated$: Observable<boolean>;
  /**
   * Whether the user has cancelled the biometric prompt.
   *
   * tracks the currently active user
   */
  promptCancelled$: Observable<boolean>;
  /**
   * Whether the user has elected to automatically prompt for biometrics.
   *
   * tracks the currently active user
   */
  promptAutomatically$: Observable<boolean>;

  abstract setEncryptedClientKeyHalf(encryptedKeyHalf: EncString): Promise<void>;
  abstract setDismissedBiometricRequirePasswordOnStartCallout(): Promise<void>;
  abstract getRequirePasswordOnStart(userId: UserId): Promise<boolean>;
  abstract setFingerprintValidated(validated: boolean): Promise<void>;
  abstract setPromptCancelled(cancelled: boolean): Promise<void>;
  abstract setPromptAutomatically(prompt: boolean): Promise<void>;
  abstract setBiometricUnlockEnabled(enabled: boolean): Promise<void>;
  abstract getBiometricUnlockEnabled(userId: UserId): Promise<boolean>;
  abstract getEncryptedClientKeyHalf(userId: UserId): Promise<EncString>;
}

export class DefaultBiometricStateService implements BiometricStateService {
  private biometricUnlockEnabledState: ActiveUserState<boolean>;
  private dismissedBiometricRequirePasswordOnStartCalloutState: ActiveUserState<boolean>;
  private encryptedClientKeyHalfState: ActiveUserState<EncryptedString | undefined>;
  private fingerprintValidatedState: GlobalState<boolean>;
  private promptCancelledState: ActiveUserState<boolean>;
  private promptAutomaticallyState: ActiveUserState<boolean>;

  biometricUnlockEnabled$: Observable<boolean>;
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;
  encryptedClientKeyHalf$: Observable<EncString | undefined>;
  requirePasswordOnStart$: Observable<boolean>;
  fingerprintValidated$: Observable<boolean>;
  promptCancelled$: Observable<boolean>;
  promptAutomatically$: Observable<boolean>;

  constructor(private stateProvider: StateProvider) {
    this.encryptedClientKeyHalfState = this.stateProvider.getActive(ENCRYPTED_CLIENT_KEY_HALF);
    this.biometricUnlockEnabledState = this.stateProvider.getActive(BIOMETRIC_UNLOCK_ENABLED);
    this.dismissedBiometricRequirePasswordOnStartCalloutState = this.stateProvider.getActive(
      DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT,
    );

    this.fingerprintValidatedState = this.stateProvider.getGlobal(FINGERPRINT_VALIDATED);
    this.promptCancelledState = this.stateProvider.getActive(PROMPT_CANCELLED);
    this.promptAutomaticallyState = this.stateProvider.getActive(PROMPT_AUTOMATICALLY);

    this.encryptedClientKeyHalf$ = this.encryptedClientKeyHalfState.state$.pipe(
      map((s) => (s == null ? null : new EncString(s))),
    );
    this.requirePasswordOnStart$ = this.encryptedClientKeyHalf$.pipe(map((keyHalf) => !!keyHalf));
    this.biometricUnlockEnabled$ = this.biometricUnlockEnabledState.state$.pipe(
      map((enabled) => !!enabled),
    );
    this.dismissedBiometricRequirePasswordOnStartCallout$ =
      this.dismissedBiometricRequirePasswordOnStartCalloutState.state$.pipe(
        map((dismissed) => !!dismissed),
      );

    this.fingerprintValidated$ = this.fingerprintValidatedState.state$.pipe(
      map((validated) => !!validated),
    );
    this.promptCancelled$ = this.promptCancelledState.state$.pipe(map((cancelled) => !!cancelled));
    this.promptAutomatically$ = this.promptAutomaticallyState.state$.pipe(
      map((prompt) => !!prompt),
    );
  }

  async setEncryptedClientKeyHalf(encryptedKeyHalf: EncString): Promise<void> {
    await this.encryptedClientKeyHalfState.update(() => encryptedKeyHalf?.encryptedString);
  }

  async setDismissedBiometricRequirePasswordOnStartCallout(): Promise<void> {
    await this.dismissedBiometricRequirePasswordOnStartCalloutState.update(() => true);
  }

  async getRequirePasswordOnStart(userId: UserId): Promise<boolean> {
    if (userId == null) {
      return false;
    }
    const state = this.stateProvider.getUser(userId, ENCRYPTED_CLIENT_KEY_HALF);
    return !!(await firstValueFrom(state.state$));
  }

  async setFingerprintValidated(validated: boolean): Promise<void> {
    await this.fingerprintValidatedState.update(() => validated);
  }

  async setPromptCancelled(cancelled: boolean): Promise<void> {
    await this.promptCancelledState.update(() => cancelled);
  }

  async setPromptAutomatically(prompt: boolean): Promise<void> {
    await this.promptAutomaticallyState.update(() => prompt);
  }

  async setBiometricUnlockEnabled(enabled: boolean): Promise<void> {
    await this.biometricUnlockEnabledState.update(() => enabled);
  }

  async getBiometricUnlockEnabled(userId: UserId): Promise<boolean> {
    return await firstValueFrom(
      this.stateProvider.getUser(userId, BIOMETRIC_UNLOCK_ENABLED).state$,
    );
  }

  async getEncryptedClientKeyHalf(userId: UserId): Promise<EncString> {
    return await firstValueFrom(
      this.stateProvider
        .getUser(userId, ENCRYPTED_CLIENT_KEY_HALF)
        .state$.pipe(map((s) => new EncString(s))),
    );
  }
}
