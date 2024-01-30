import { Observable, firstValueFrom, map } from "rxjs";

import { UserId } from "../../types/guid";
import { EncryptedString, EncString } from "../models/domain/enc-string";
import { ActiveUserState, GlobalState, StateProvider } from "../state";

import {
  NO_AUTO_PROMPT_TEXT,
  BIOMETRIC_TEXT,
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
  encryptedClientKeyHalf$: Observable<EncryptedString | undefined>;
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
   * The text to display as a title to the biometric setting.
   */
  biometricText$: Observable<string>;
  /**
   * The text to display as a description to the disable biometric auto prompt setting.
   */
  biometricNoAutoPromptText$: Observable<string>;
  /**
   * TODO: verify this
   * Whether the browser fingerprint has been validated this session.
   *
   * Tracks the currently active user
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
  abstract setDismissedBiometricRequirePasswordOnStartCallout(value: boolean): Promise<void>;
  abstract getRequirePasswordOnStart(userId: UserId): Promise<boolean>;

  abstract setBiometricText(text: string): Promise<void>;
  abstract setNoAutoPromptBiometricsText(text: string): Promise<void>;
}

export class DefaultBiometricStateService implements BiometricStateService {
  private biometricUnlockEnabledState: ActiveUserState<boolean>;
  private dismissedBiometricRequirePasswordOnStartCalloutState: ActiveUserState<boolean>;
  private encryptedClientKeyHalfState: ActiveUserState<EncryptedString | undefined>;
  private biometricTextState: GlobalState<string>;
  private biometricNoAutoPromptTextState: GlobalState<string>;
  private fingerprintValidatedState: ActiveUserState<boolean>;
  private promptCancelledState: ActiveUserState<boolean>;
  private promptAutomaticallyState: ActiveUserState<boolean>;

  biometricUnlockEnabled$: Observable<boolean>;
  dismissedBiometricRequirePasswordOnStartCallout$: Observable<boolean>;
  encryptedClientKeyHalf$: Observable<EncryptedString | undefined>;
  requirePasswordOnStart$: Observable<boolean>;
  biometricText$: Observable<string>;
  biometricNoAutoPromptText$: Observable<string>;
  fingerprintValidated$: Observable<boolean>;
  promptCancelled$: Observable<boolean>;
  promptAutomatically$: Observable<boolean>;

  constructor(private stateProvider: StateProvider) {
    this.encryptedClientKeyHalfState = this.stateProvider.getActive(ENCRYPTED_CLIENT_KEY_HALF);
    this.biometricUnlockEnabledState = this.stateProvider.getActive(BIOMETRIC_UNLOCK_ENABLED);
    this.dismissedBiometricRequirePasswordOnStartCalloutState = this.stateProvider.getActive(
      DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT,
    );

    this.biometricTextState = this.stateProvider.getGlobal(BIOMETRIC_TEXT);
    this.biometricNoAutoPromptTextState = this.stateProvider.getGlobal(NO_AUTO_PROMPT_TEXT);

    this.fingerprintValidatedState = this.stateProvider.getActive(FINGERPRINT_VALIDATED);
    this.promptCancelledState = this.stateProvider.getActive(PROMPT_CANCELLED);
    this.promptAutomaticallyState = this.stateProvider.getActive(PROMPT_AUTOMATICALLY);

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
}
