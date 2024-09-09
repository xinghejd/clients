import { ipcRenderer } from "electron";

import { BiometricsStatus } from "@bitwarden/common/key-management/biometrics/biometrics-status";
import { KeySuffixOptions } from "@bitwarden/common/platform/enums";

import { BiometricMessage, BiometricAction } from "../types/biometric-message";

const biometric = {
  enabled: (userId: string): Promise<boolean> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.EnabledForUser,
      key: `${userId}_user_biometric`,
      keySuffix: KeySuffixOptions.Biometric,
      userId: userId,
    } satisfies BiometricMessage),
  status: (): Promise<BiometricsStatus> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.GetStatus,
    } satisfies BiometricMessage),
  statusForUser: (userId: string): Promise<BiometricsStatus> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.GetStatusForUser,
      userId: userId,
    } satisfies BiometricMessage),
  biometricsSetup: (): Promise<void> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.Setup,
    } satisfies BiometricMessage),
  authenticate: (): Promise<boolean> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.Authenticate,
    } satisfies BiometricMessage),
};

export default {
  biometric,
};
