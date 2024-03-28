import { parse } from "tldts";

import { Fido2CredentialStore, Fido2UserInterface } from "@bitwarden/sdk-client";

import { BitwardenSdkServiceAbstraction } from "../../../abstractions/bitwarden-sdk.service.abstraction";
import { LogService } from "../../../platform/abstractions/log.service";
import { Utils } from "../../../platform/misc/utils";
import { CipherService } from "../../abstractions/cipher.service";
import {
  Fido2AuthenticatorError,
  Fido2AuthenticatorErrorCode,
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorService,
} from "../../abstractions/fido2/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  FallbackRequestedError,
  Fido2ClientService as Fido2ClientServiceAbstraction,
  UserRequestedFallbackAbortReason,
} from "../../abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";
import { CipherType } from "../../enums";
import { CipherView } from "../../models/view/cipher.view";
import { Fido2CredentialView } from "../../models/view/fido2-credential.view";

import { isValidRpId } from "./domain-utils";
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
    private authenticator: Fido2AuthenticatorService,
    private logService?: LogService,
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
          credentialName: params.credentialName,
          userName: params.userName,
          userVerification: false,
        });
        return { vaultItem: { cipherId: result.cipherId, name: "unknown" } };
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
        await session.ensureUnlockedVault();
        const ciphers = await this.findCredentials([], params.rp_id);
        return ciphers.map((cipher) => ({
          cipherId: cipher.id,
          name: cipher.name,
        }));
      },

      saveCredential: async (params) => {
        // eslint-disable-next-line no-console
        console.log("js.saveCredential called", params);

        const cipher = await this.cipherService.get(params.vaultItem.cipherId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const decrypted = await cipher.decrypt(
          await this.cipherService.getKeyForCipherKeyDecryption(cipher),
        );

        const rustCredential = params.vaultItem.fido2Credential;
        if (rustCredential == null) {
          throw new Error("Saving empty credentials is not allowed");
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const fido2Credential = new Fido2CredentialView();
        fido2Credential.credentialId = rustCredential.credentialId;
        fido2Credential.keyType = rustCredential.keyType;
        fido2Credential.keyAlgorithm = mapAlgorithm(rustCredential.keyAlgorithm);
        fido2Credential.keyCurve = mapCurve(rustCredential.keyCurve);
        fido2Credential.keyValue = rustCredential.keyValue;
        fido2Credential.rpId = rustCredential.rpId;
        fido2Credential.userHandle = rustCredential.userHandle;
        fido2Credential.userName = rustCredential.userName;
        fido2Credential.counter = rustCredential.counter;
        fido2Credential.rpName = rustCredential.rpName;
        fido2Credential.userDisplayName = rustCredential.userDisplayName;
        fido2Credential.discoverable = rustCredential.discoverable;
        fido2Credential.creationDate = new Date(rustCredential.creationDate);

        decrypted.login.fido2Credentials = [fido2Credential];
        const encrypted = await this.cipherService.encrypt(decrypted);
        await this.cipherService.updateWithServer(encrypted);
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
    const parsedOrigin = parse(params.origin, { allowPrivateDomains: true });
    const enableFido2VaultCredentials = await this.isFido2FeatureEnabled(
      parsedOrigin.hostname,
      params.origin,
    );

    if (!enableFido2VaultCredentials) {
      this.logService?.warning(`[Fido2Client] Fido2VaultCredential is not enabled`);
      throw new FallbackRequestedError();
    }

    params.rpId = params.rpId ?? parsedOrigin.hostname;

    if (parsedOrigin.hostname == undefined || !params.origin.startsWith("https://")) {
      this.logService?.warning(`[Fido2Client] Invalid https origin: ${params.origin}`);
      throw new DOMException("'origin' is not a valid https origin", "SecurityError");
    }

    if (!isValidRpId(params.rpId, params.origin)) {
      this.logService?.warning(
        `[Fido2Client] 'rp.id' cannot be used with the current origin: rp.id = ${params.rpId}; origin = ${params.origin}`,
      );
      throw new DOMException("'rp.id' cannot be used with the current origin", "SecurityError");
    }

    const collectedClientData = {
      type: "webauthn.get",
      challenge: params.challenge,
      origin: params.origin,
      crossOrigin: !params.sameOriginWithAncestors,
      // tokenBinding: {} // Not currently supported
    };
    const clientDataJSON = JSON.stringify(collectedClientData);
    const clientDataJSONBytes = Utils.fromByteStringToArray(clientDataJSON);
    const clientDataHash = await crypto.subtle.digest({ name: "SHA-256" }, clientDataJSONBytes);
    const getAssertionParams = mapToGetAssertionParams({ params, clientDataHash });

    if (abortController.signal.aborted) {
      this.logService?.info(`[Fido2Client] Aborted with AbortController`);
      throw new DOMException("The operation either timed out or was not allowed.", "AbortError");
    }

    // const timeout = setAbortTimeout(abortController, params.userVerification, params.timeout);

    let getAssertionResult;
    try {
      getAssertionResult = await this.authenticator.getAssertion(
        getAssertionParams,
        tab,
        abortController,
      );
    } catch (error) {
      if (
        abortController.signal.aborted &&
        abortController.signal.reason === UserRequestedFallbackAbortReason
      ) {
        this.logService?.info(`[Fido2Client] Aborting because user requested fallback`);
        throw new FallbackRequestedError();
      }

      if (
        error instanceof Fido2AuthenticatorError &&
        error.errorCode === Fido2AuthenticatorErrorCode.InvalidState
      ) {
        this.logService?.warning(`[Fido2Client] Unknown error: ${error}`);
        throw new DOMException("Unknown error occured.", "InvalidStateError");
      }

      this.logService?.info(`[Fido2Client] Aborted by user: ${error}`);
      throw new DOMException(
        "The operation either timed out or was not allowed.",
        "NotAllowedError",
      );
    }

    if (abortController.signal.aborted) {
      this.logService?.info(`[Fido2Client] Aborted with AbortController`);
      throw new DOMException("The operation either timed out or was not allowed.", "AbortError");
    }
    // clearTimeout(timeout);

    return {
      authenticatorData: Fido2Utils.bufferToString(getAssertionResult.authenticatorData),
      clientDataJSON: Fido2Utils.bufferToString(clientDataJSONBytes),
      credentialId: Fido2Utils.bufferToString(getAssertionResult.selectedCredential.id),
      userHandle:
        getAssertionResult.selectedCredential.userHandle !== undefined
          ? Fido2Utils.bufferToString(getAssertionResult.selectedCredential.userHandle)
          : undefined,
      signature: Fido2Utils.bufferToString(getAssertionResult.signature),
    };
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

function mapAlgorithm(algorithm: string): "ECDSA" {
  if (algorithm !== "ECDSA") {
    throw new Error("Unsupported algorithm, cannot save credential");
  }

  return "ECDSA";
}

function mapCurve(curve: string): "P-256" {
  if (curve !== "P-256") {
    throw new Error("Unsupported curve, cannot save credential");
  }

  return "P-256";
}

/**
 * Convert data gathered by the WebAuthn Client to a format that can be used by the authenticator.
 */
function mapToGetAssertionParams({
  params,
  clientDataHash,
}: {
  params: AssertCredentialParams;
  clientDataHash: ArrayBuffer;
}): Fido2AuthenticatorGetAssertionParams {
  const allowCredentialDescriptorList: PublicKeyCredentialDescriptor[] =
    params.allowedCredentialIds.map((id) => ({
      id: Fido2Utils.stringToBuffer(id),
      type: "public-key",
    }));

  const requireUserVerification =
    params.userVerification === "required" ||
    params.userVerification === "preferred" ||
    params.userVerification === undefined;

  return {
    rpId: params.rpId,
    requireUserVerification,
    hash: clientDataHash,
    allowCredentialDescriptorList,
    extensions: {},
    fallbackSupported: params.fallbackSupported,
  };
}
