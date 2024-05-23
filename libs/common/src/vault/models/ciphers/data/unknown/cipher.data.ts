import { Jsonify } from "type-fest";

import { CipherResponseUnknownVersion } from "../../response/unknown/cipher.response";

export class CipherDataUnknownVersion {
  version: unknown;

  constructor(public value?: CipherResponseUnknownVersion) {}

  static fromJSON(obj: Jsonify<unknown>) {
    return Object.assign(new CipherDataUnknownVersion(), obj);
  }
}
