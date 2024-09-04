import {
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorGetAssertionResult,
  Fido2AuthenticatorMakeCredentialResult,
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction,
} from "@bitwarden/common/platform/abstractions/fido2/fido2-authenticator.service.abstraction";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Fido2Utils } from "@bitwarden/common/platform/services/fido2/fido2-utils";
import type { autofill } from "@bitwarden/desktop-napi";

export class NativeAutofillRendererService {
  constructor(
    private logService: LogService,
    private fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction<void>,
  ) {
    ipc.autofill.listenPasskeyRegistration((clientId, sequenceNumber, request, callback) => {
      this.logService.warning("listenPasskeyRegistration", clientId, sequenceNumber, request);
      this.logService.warning(
        "listenPasskeyRegistration2",
        this.convertRegistrationRequest(request),
      );

      const controller = new AbortController();
      void this.fido2AuthenticatorService
        .makeCredential(this.convertRegistrationRequest(request), null, controller)
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
        .getAssertion(this.convertAssertionRequest(request), null, controller)
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
