import { Fido2MakeCredentialUserInterface } from "@bitwarden/sdk-client";

import { BitwardenSdkServiceAbstraction } from "../../../abstractions/bitwarden-sdk.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService as Fido2ClientServiceAbstraction,
} from "../../abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";

/**
 * SDK interface for the Web Authentication API as described by W3C
 * https://www.w3.org/TR/webauthn-3/#sctn-api
 */
export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(
    private bitwardenSdkService: BitwardenSdkServiceAbstraction,
    private userInterface: Fido2UserInterfaceService,
  ) {}

  async isFido2FeatureEnabled(hostname: string, origin: string): Promise<boolean> {
    return true;
  }

  async createCredential(
    params: CreateCredentialParams,
    tab: chrome.tabs.Tab,
    abortController = new AbortController(),
  ): Promise<CreateCredentialResult> {
    const client = await this.bitwardenSdkService.getClient();
    // eslint-disable-next-line no-console
    console.log("calling sdk");
    const session = await this.userInterface.newSession(
      params.fallbackSupported,
      tab,
      abortController,
    );
    const userInterface: Fido2MakeCredentialUserInterface = {
      confirm_new_credential: async (credentialName, userName, userVerification) => {
        // eslint-disable-next-line no-console
        console.log("js.confirm_new_credential called", {
          credentialName,
          userName,
          userVerification,
        });
        const result = await session.confirmNewCredential({
          credentialName,
          userName,
          userVerification,
        });
        return result.cipherId;
      },
    };
    const result = await client.client.client_create_credential("request", userInterface);
    // eslint-disable-next-line no-console
    console.log("result", result);

    throw new Error("Not implemented.");
  }

  async assertCredential(
    params: AssertCredentialParams,
    tab: chrome.tabs.Tab,
    abortController = new AbortController(),
  ): Promise<AssertCredentialResult> {
    throw new Error("Not implemented.");
  }
}
