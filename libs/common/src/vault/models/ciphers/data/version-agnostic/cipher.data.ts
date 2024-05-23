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

  constructor(response?: CipherResponse) {
    if (response == undefined) {
      return;
    }

    this.value = this.constructData(response);
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
}
