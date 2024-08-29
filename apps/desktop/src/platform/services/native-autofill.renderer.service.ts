import { Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-authenticator.service.abstraction";
import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  Fido2UserInterfaceSession,
  NewCredentialParams,
  PickCredentialParams,
} from "@bitwarden/common/platform/abstractions/fido2/fido2-user-interface.service.abstraction";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Fido2Utils } from "@bitwarden/common/platform/services/fido2/fido2-utils";

export class NativeAutofillRendererService {
  constructor(
    private logService: LogService,
    private fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction<number>,
  ) {
    ipc.autofill.listenPasskeyRegistration((data, callback) => {
      this.logService.warning("listenPasskeyRegistration", data);

      const controller = new AbortController();
      void this.fido2AuthenticatorService
        .makeCredential(
          {
            hash: new Uint8Array(data.value.clientDataHash),
            rpEntity: {
              name: data.value.relyingPartyId, // TODO: Get this from somewher
              id: data.value.relyingPartyId,
            },
            userEntity: {
              id: new Uint8Array(data.value.userHandle),
              name: data.value.userName,
              displayName: undefined,
              icon: undefined,
            },
            credTypesAndPubKeyAlgs: [
              // TODO: Actually get these from the OS
              { alg: -7, type: "public-key" },
              { alg: -257, type: "public-key" },
            ],
            // TODO: Marked as optional but needs to be defined?
            excludeCredentialDescriptorList: [],
            requireResidentKey: false,
            requireUserVerification: false,
            fallbackSupported: false,
          },
          data.sequenceNumber,
          controller,
        )
        .then((result) => {
          callback({
            relyingParty: data.value.relyingPartyId,
            clientDataHash: data.value.clientDataHash,
            credentialId: Array.from(Fido2Utils.bufferSourceToUint8Array(result.credentialId)),
            attestationObject: Array.from(
              Fido2Utils.bufferSourceToUint8Array(result.attestationObject),
            ),
          });
        });
    });

    ipc.autofill.listenPasskeyAssertion((data, callback) => {
      this.logService.warning("listenPasskeyAssertion", data);

      const controller = new AbortController();
      void this.fido2AuthenticatorService
        .getAssertion(
          {
            rpId: data.value.relyingPartyId,
            hash: new Uint8Array(data.value.clientDataHash),
            allowCredentialDescriptorList: [
              /* {
                id: new Uint8Array(data.value.credentialId),
                type: "public-key",
              },*/
            ],
            requireUserVerification: true,
            extensions: undefined,
            fallbackSupported: false,
          },
          data.sequenceNumber,
          controller, // TODO: The typing says this can be null, but it throws an error if it is
        )
        .then((result) => {
          this.logService.warning("assertCredential", result, data.value.credentialId);

          callback({
            userHandle: Array.from(result.selectedCredential.userHandle),
            relyingParty: data.value.relyingPartyId,
            signature: Array.from(result.signature),
            clientDataHash: data.value.clientDataHash,
            authenticatorData: Array.from(result.authenticatorData),
            credentialId: Array.from(result.selectedCredential.id),
          });
        });
    });
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
