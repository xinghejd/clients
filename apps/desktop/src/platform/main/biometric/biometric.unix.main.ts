import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { biometrics , passwords } from "@bitwarden/desktop-native";

import { WindowMain } from "../../../main/window.main";

import { OsBiometricService } from "./biometrics.service.abstraction";

export default class BiometricUnixMain implements OsBiometricService {
  constructor(
    private i18nservice: I18nService,
    private windowMain: WindowMain,
    private stateService: StateService
  ) {}

  async getBiometricKey(service: string, key: string): Promise<string> {
    const success = await this.authenticateBiometric();

    if (!success) {
      throw new Error("Biometric authentication failed");
    }

    return await passwords.getPassword(service, key);
  }

  async setBiometricKey(service: string, key: string, value: string): Promise<void> {
    return await passwords.setPassword(service, key, value);
  }
  async deleteBiometricKey(service: string, key: string): Promise<void> {
    await passwords.deletePassword(service, key);
  }

  async init() {
    await this.stateService.setBiometricText("unlockWithPolkit");
    await this.stateService.setNoAutoPromptBiometricsText("autoPromptPolkit");
  }

  async authenticateBiometric(): Promise<boolean> {
    const hwnd = this.windowMain.win.getNativeWindowHandle();
    return await biometrics.prompt(hwnd, this.i18nservice.t("polkitConsentMessage"));
  }

  async osSupportsBiometric(): Promise<boolean> {
    return true;
  }
}
