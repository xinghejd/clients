import { BitwardenSdkServiceAbstraction } from "../../../abstractions/bitwarden-sdk.service.abstraction";
import { AuthService } from "../../../auth/abstractions/auth.service";
import { ConfigServiceAbstraction } from "../../../platform/abstractions/config/config.service.abstraction";
import { LogService } from "../../../platform/abstractions/log.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { Fido2AuthenticatorService } from "../../abstractions/fido2/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService as Fido2ClientServiceAbstraction,
} from "../../abstractions/fido2/fido2-client.service.abstraction";
import { VaultSettingsService } from "../../abstractions/vault-settings/vault-settings.service";

/**
 * SDK interface for the Web Authentication API as described by W3C
 * https://www.w3.org/TR/webauthn-3/#sctn-api
 */
export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(private bitwardenSdkService: BitwardenSdkServiceAbstraction) {}

  async isFido2FeatureEnabled(hostname: string, origin: string): Promise<boolean> {
    return true;
  }

  async createCredential(
    params: CreateCredentialParams,
    tab: chrome.tabs.Tab,
    abortController = new AbortController(),
  ): Promise<CreateCredentialResult> {
    throw new Error("Not implemented.");
  }

  async assertCredential(
    params: AssertCredentialParams,
    tab: chrome.tabs.Tab,
    abortController = new AbortController(),
  ): Promise<AssertCredentialResult> {
    const client = await this.bitwardenSdkService.getClient();
    console.log("calling sdk");
    const result = await client.client_get_assertion();
    console.log("result", result);

    throw new Error("Not implemented.");
  }
}
