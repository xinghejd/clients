import { SymmetricCryptoKey } from "../../../../../platform/models/domain/symmetric-crypto-key";
import { LoginApiV2 } from "../../api/v2/login.api";
import { LoginDataV1 } from "../v1/login.data";

import { Fido2CredentialDataV2 } from "./fido2-credential.data";
import { LoginUriDataV2 } from "./login-uri.data";

export class LoginDataV2 {
  uris: LoginUriDataV2[];
  username: string;
  password: string;
  passwordRevisionDate: string;
  totp: string;
  autofillOnPageLoad: boolean;
  fido2Credentials?: Fido2CredentialDataV2[];

  constructor(data?: LoginApiV2) {
    if (data == null) {
      return;
    }

    this.username = data.username;
    this.password = data.password;
    this.passwordRevisionDate = data.passwordRevisionDate;
    this.totp = data.totp;
    this.autofillOnPageLoad = data.autofillOnPageLoad;

    if (data.uris) {
      this.uris = data.uris.map((u) => new LoginUriDataV2(u));
    }

    if (data.fido2Credentials) {
      this.fido2Credentials = data.fido2Credentials?.map((key) => new Fido2CredentialDataV2(key));
    }
  }

  static async migrate(
    old: LoginDataV1,
    organizationId: string,
    key: SymmetricCryptoKey,
  ): Promise<LoginDataV2> {
    const migrated = new LoginDataV2();

    migrated.username = old.username;
    migrated.password = old.password;
    migrated.passwordRevisionDate = old.passwordRevisionDate;
    migrated.totp = old.totp;
    migrated.autofillOnPageLoad = old.autofillOnPageLoad;

    if (old.uris) {
      migrated.uris = old.uris.map((u) => LoginUriDataV2.migrate(u));
    }

    if (old.fido2Credentials) {
      migrated.fido2Credentials = await Promise.all(
        old.fido2Credentials?.map((c) => Fido2CredentialDataV2.migrate(c, organizationId, key)),
      );
    }

    return migrated;
  }
}
