import {
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorGetAssertionResult,
  Fido2AuthenticatorMakeCredentialResult,
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction,
} from "@bitwarden/common/platform/abstractions/fido2/fido2-authenticator.service.abstraction";
import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  Fido2UserInterfaceSession,
  NewCredentialParams,
  PickCredentialParams,
} from "@bitwarden/common/platform/abstractions/fido2/fido2-user-interface.service.abstraction";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Fido2Utils } from "@bitwarden/common/platform/services/fido2/fido2-utils";
import type { autofill } from "@bitwarden/desktop-napi";

export class NativeAutofillRendererService {
  constructor(
    private logService: LogService,
    private fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction<number>,
  ) {
    ipc.autofill.listenPasskeyRegistration((clientId, sequenceNumber, request, callback) => {
      this.logService.warning("listenPasskeyRegistration", clientId, sequenceNumber, request);
      this.logService.warning(
        "listenPasskeyRegistration2",
        this.convertRegistrationRequest(request),
      );

      const controller = new AbortController();
      void this.fido2AuthenticatorService
        .makeCredential(this.convertRegistrationRequest(request), sequenceNumber, controller)
        .then((response) => {
          callback(null, this.convertRegistrationResponse(request, response));
        })
        .catch((error) => {
          this.logService.error("listenPasskeyRegistration error", error);
          callback(error, null);
        });
    });

    ipc.autofill.listenPasskeyAssertion((clientId, sequenceNumber, request, callback) => {
      this.logService.warning("listenPasskeyAssertion", clientId, sequenceNumber, request);

      const controller = new AbortController();
      void this.fido2AuthenticatorService
        .getAssertion(this.convertAssertionRequest(request), sequenceNumber, controller)
        .then((response) => {
          callback(null, this.convertAssertionResponse(request, response));
        })
        .catch((error) => {
          this.logService.error("listenPasskeyAssertion error", error);
          callback(error, null);
        });
    });
  }

  private convertRegistrationRequest(
    request: autofill.PasskeyRegistrationRequest,
  ): Fido2AuthenticatorMakeCredentialsParams {
    return {
      hash: new Uint8Array(request.clientDataHash),
      rpEntity: {
        name: request.relyingPartyId, // TODO: Get this from somewhere
        id: request.relyingPartyId,
      },
      userEntity: {
        id: new Uint8Array(request.userHandle),
        name: request.userName,
        displayName: request.userName, // TODO: Different field?
        icon: undefined,
      },
      credTypesAndPubKeyAlgs: request.supportedAlgorithms.map((alg) => ({
        alg,
        type: "public-key",
      })),
      // TODO: Marked as optional but needs to be defined?
      excludeCredentialDescriptorList: [],
      requireResidentKey: false,
      requireUserVerification: request.userVerification === "required",
      fallbackSupported: false,
    };
  }

  private convertRegistrationResponse(
    request: autofill.PasskeyRegistrationRequest,
    response: Fido2AuthenticatorMakeCredentialResult,
  ): autofill.PasskeyRegistrationResponse {
    return {
      relyingParty: request.relyingPartyId,
      clientDataHash: request.clientDataHash,
      credentialId: Array.from(Fido2Utils.bufferSourceToUint8Array(response.credentialId)),
      attestationObject: Array.from(
        Fido2Utils.bufferSourceToUint8Array(response.attestationObject),
      ),
    };
  }

  private convertAssertionRequest(
    request: autofill.PasskeyAssertionRequest,
  ): Fido2AuthenticatorGetAssertionParams {
    return {
      rpId: request.relyingPartyId,
      hash: new Uint8Array(request.clientDataHash),
      allowCredentialDescriptorList: [], // TODO: Fill this?
      extensions: undefined,
      requireUserVerification: request.userVerification === "required",
      fallbackSupported: false,
    };
  }

  private convertAssertionResponse(
    request: autofill.PasskeyAssertionRequest,
    response: Fido2AuthenticatorGetAssertionResult,
  ): autofill.PasskeyAssertionResponse {
    return {
      userHandle: Array.from(response.selectedCredential.userHandle),
      relyingParty: request.relyingPartyId,
      signature: Array.from(response.signature),
      clientDataHash: request.clientDataHash,
      authenticatorData: Array.from(response.authenticatorData),
      credentialId: Array.from(response.selectedCredential.id),
    };
  }
}

// TODO: Move this somewhere else

export class DesktopFido2UserInterfaceService
  implements Fido2UserInterfaceServiceAbstraction<number>
{
  constructor(private logService: LogService) {}

  async newSession(
    fallbackSupported: boolean,
    tab: number,
    abortController?: AbortController,
  ): Promise<DesktopFido2UserInterfaceSession> {
    this.logService.warning("newSession", fallbackSupported, tab, abortController);
    return new DesktopFido2UserInterfaceSession(this.logService);
  }
}

export class DesktopFido2UserInterfaceSession implements Fido2UserInterfaceSession {
  constructor(private logService: LogService) {}

  async pickCredential({
    cipherIds,
    userVerification,
  }: PickCredentialParams): Promise<{ cipherId: string; userVerified: boolean }> {
    this.logService.warning("pickCredential", cipherIds, userVerification);
    return { cipherId: cipherIds[0], userVerified: userVerification };
  }

  async confirmNewCredential({
    credentialName,
    userName,
    userVerification,
    rpId,
  }: NewCredentialParams): Promise<{ cipherId: string; userVerified: boolean }> {
    this.logService.warning(
      "confirmNewCredential",
      credentialName,
      userName,
      userVerification,
      rpId,
    );
    // TODO: Implement this correctly
    return { cipherId: "a046ec6e-9764-436d-b15a-b1db0144782c", userVerified: userVerification };
  }

  async informExcludedCredential(existingCipherIds: string[]): Promise<void> {
    this.logService.warning("informExcludedCredential", existingCipherIds);
  }

  async ensureUnlockedVault(): Promise<void> {
    this.logService.warning("ensureUnlockedVault");
  }

  async informCredentialNotFound(): Promise<void> {
    this.logService.warning("informCredentialNotFound");
  }

  async close() {
    this.logService.warning("close");
  }
}
