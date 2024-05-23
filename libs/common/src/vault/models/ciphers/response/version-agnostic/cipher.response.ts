import { CipherResponseUnknownVersion } from "../unknown/cipher.response";
import { CipherResponseV1 } from "../v1/cipher.response";
import { CipherResponseV2 } from "../v2/cipher.response";

export type CipherResponseAnyVersion =
  | CipherResponseUnknownVersion
  | CipherResponseV1
  | CipherResponseV2;

export class CipherResponse {
  value: CipherResponseAnyVersion;

  constructor(value: unknown) {
    this.value = this.constructResponse(value);
  }

  // TODO: This is a temporary solution for CipherService.createWithServer.
  // We really shouldn't jumping from Reponse -> Domain model like that,
  // not to mention that the function modifies its input parameter.
  get id() {
    if (this.value instanceof CipherResponseV1 || this.value instanceof CipherResponseV2) {
      return this.value.id;
    }

    return null;
  }

  // TODO: This is a temporary solution for org-vault-export.service.ts.
  // Ideally we shouldn't be writing logic that directly uses a response.
  get deletedDate() {
    if (this.value instanceof CipherResponseV1 || this.value instanceof CipherResponseV2) {
      return this.value.deletedDate;
    }

    return null;
  }

  // TODO: This is a temporary solution for CipherService.restoreWithServer.
  // Ideally we shouldn't be writing logic that directly uses a response.
  get revisionDate() {
    if (this.value instanceof CipherResponseV1 || this.value instanceof CipherResponseV2) {
      return this.value.revisionDate;
    }

    return null;
  }

  private constructResponse(value: unknown) {
    switch (this.getVersion(value)) {
      case 1:
        return new CipherResponseV1(value);
      case 2:
        return new CipherResponseV2(value);
      default:
        return new CipherResponseUnknownVersion(value);
    }
  }

  private getVersion(value: unknown): number | undefined {
    const version = (value as { version?: any }).version;

    if (version == undefined) {
      return 1;
    }

    const versionNumber = parseInt(version);
    if (isNaN(versionNumber)) {
      return undefined;
    }

    return versionNumber;
  }
}
