import { Fido2CredentialStore, Fido2UserInterface } from "@bitwarden/sdk-client";

import { BitwardenSdkServiceAbstraction } from "../../../abstractions/bitwarden-sdk.service.abstraction";
import { CipherService } from "../../abstractions/cipher.service";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService as Fido2ClientServiceAbstraction,
} from "../../abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";
import { CipherType } from "../../enums";
import { CipherView } from "../../models/view/cipher.view";

import { Fido2Utils } from "./fido2-utils";
import { guidToStandardFormat } from "./guid-utils";

/**
 * SDK interface for the Web Authentication API as described by W3C
 * https://www.w3.org/TR/webauthn-3/#sctn-api
 */
export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(
    private bitwardenSdkService: BitwardenSdkServiceAbstraction,
    private userInterface: Fido2UserInterfaceService,
    private cipherService: CipherService,
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
    const userInterface: Fido2UserInterface = {
      confirmNewCredential: async (params) => {
        // eslint-disable-next-line no-console
        console.log("js.confirmNewCredential called", { params });

        const result = await session.confirmNewCredential({
          credentialName: params.credential_name,
          userName: params.user_name,
          userVerification: false,
        });
        return { vault_item: { cipher_id: result.cipherId, name: "unknown" } };
      },

      pickCredential: async (params: unknown): Promise<any> => {
        // eslint-disable-next-line no-console
        console.log("js.pickCredential called");

        throw new Error("Not implemented.");
      },

      checkUserVerification: async (): Promise<boolean> => {
        // eslint-disable-next-line no-console
        console.log("js.checkUserVerification called");

        return true;
      },

      checkUserPresence: async (): Promise<boolean> => {
        // eslint-disable-next-line no-console
        console.log("js.checkUserPresence called");

        return true;
      },

      isPresenceEnabled: (): boolean => {
        // eslint-disable-next-line no-console
        console.log("js.isPresenceEnabled called");

        return true;
      },

      isVerificationEnabled: (): boolean | undefined => {
        // eslint-disable-next-line no-console
        console.log("js.isVerificationEnabled called");

        return true;
      },
    };

    const credentialStore: Fido2CredentialStore = {
      findCredentials: async (params) => {
        // Todo implement id mapping
        const ciphers = await this.findCredentials([], params.rp_id);

        return ciphers.map((cipher) => ({
          cipher_id: cipher.id,
          name: cipher.name,
        }));
      },

      saveCredential: async (params) => {
        // eslint-disable-next-line no-console
        console.log("js.saveCredential called", params);

        // throw new Error("Not implemented.");
      },
    };

    const result = await client.client.client_create_credential(
      { options: params.rawRequest, origin: params.origin },
      userInterface,
      credentialStore,
    );
    // eslint-disable-next-line no-console
    console.log("result", result);

    return {
      credentialId: result.id,
      clientDataJSON: Fido2Utils.bufferToString(result.response.clientDataJSON),
      attestationObject: Fido2Utils.bufferToString(result.response.attestationObject),
      authData: Fido2Utils.bufferToString(result.response.authenticatorData),
      publicKey: Fido2Utils.bufferToString(result.response.publicKey),
      publicKeyAlgorithm: result.response.publicKeyAlgorithm,
      transports: result.response.transports,
      extensions: result.clientExtensionResults && {
        credProps: result.clientExtensionResults.credProps && {
          rk: result.clientExtensionResults.credProps.rk,
        },
      },
    };
  }

  async assertCredential(
    params: AssertCredentialParams,
    tab: chrome.tabs.Tab,
    abortController = new AbortController(),
  ): Promise<AssertCredentialResult> {
    throw new Error("Not implemented.");
  }

  async findCredentials(
    credentials: PublicKeyCredentialDescriptor[],
    rpId: string,
  ): Promise<CipherView[]> {
    // if (credentials.length === 0) {
    return this.findCredentialsByRp(rpId);
    // }

    // return this.findCredentialsById(credentials, rpId);
  }

  private async findCredentialsById(
    credentials: PublicKeyCredentialDescriptor[],
    rpId: string,
  ): Promise<CipherView[]> {
    const ids: string[] = [];

    for (const credential of credentials) {
      try {
        ids.push(guidToStandardFormat(credential.id));
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (ids.length === 0) {
      return [];
    }

    const ciphers = await this.cipherService.getAllDecrypted();
    return ciphers.filter(
      (cipher) =>
        !cipher.isDeleted &&
        cipher.type === CipherType.Login &&
        cipher.login.hasFido2Credentials &&
        cipher.login.fido2Credentials[0].rpId === rpId &&
        ids.includes(cipher.login.fido2Credentials[0].credentialId),
    );
  }

  private async findCredentialsByRp(rpId: string): Promise<CipherView[]> {
    const ciphers = await this.cipherService.getAllDecrypted();
    return ciphers.filter(
      (cipher) =>
        !cipher.isDeleted &&
        cipher.type === CipherType.Login &&
        cipher.login.hasFido2Credentials &&
        cipher.login.fido2Credentials[0].rpId === rpId &&
        cipher.login.fido2Credentials[0].discoverable,
    );
  }
}
