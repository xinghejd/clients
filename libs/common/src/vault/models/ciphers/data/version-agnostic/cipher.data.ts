import { Jsonify } from "type-fest";

import { UserKey } from "../../../../../types/key";
import { CipherResponseV1 } from "../../response/v1/cipher.response";
import { CipherResponseV2 } from "../../response/v2/cipher.response";
import { CipherResponse } from "../../response/version-agnostic/cipher.response";
import { CipherDataLatest } from "../latest";
import { CipherDataUnknownVersion } from "../unknown/cipher.data";
import { CipherDataV1 } from "../v1/cipher.data";
import { CipherDataV2 } from "../v2/cipher.data";

export type CipherDataAnyVersion = CipherDataUnknownVersion | CipherDataV1 | CipherDataV2;

export class CipherData {
  value: CipherDataAnyVersion;

  constructor(responseOrData?: CipherResponse | CipherDataAnyVersion) {
    if (responseOrData == undefined) {
      return;
    }

    if (responseOrData instanceof CipherResponse) {
      this.value = this.constructData(responseOrData);
      return;
    }

    this.value = responseOrData;
  }

  // TODO: This is a temporary solution for CipherService.
  // We probably shouldn't be directly modifying data objects.
  get deletedDate() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return null;
    }

    return this.value.deletedDate;
  }

  set deletedDate(value: string) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.deletedDate = value;
  }

  // TODO: This is a temporary solution for CipherService.
  // We probably shouldn't be directly modifying data objects.
  get revisionDate() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return null;
    }

    return this.value.revisionDate;
  }

  set revisionDate(value: string) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.revisionDate = value;
  }

  /**
   * This function will migrate any underlying data object to the latest version
   * @param key Used to decrypt fields that need to be read for migration
   */
  toLatestVersion(key: UserKey): CipherDataLatest {
    throw new Error("Not yet implemented");
  }

  private constructData(response: CipherResponse) {
    if (response.value instanceof CipherResponseV1) {
      return new CipherDataV1(response.value);
    } else if (response.value instanceof CipherResponseV2) {
      return new CipherDataV2(response.value);
    } else {
      return new CipherDataUnknownVersion(response.value);
    }
  }

  static fromJSON(obj: Jsonify<CipherData>) {
    let value: CipherDataAnyVersion;

    switch (obj.value.version) {
      case 1:
        value = CipherDataV1.fromJSON(obj.value);
        break;
      case 2:
        value = CipherDataV2.fromJSON(obj.value);
        break;
      default:
        value = CipherDataUnknownVersion.fromJSON(obj.value);
        break;
    }

    const toReturn = new CipherData();
    toReturn.value = value;

    return toReturn;
  }
}
