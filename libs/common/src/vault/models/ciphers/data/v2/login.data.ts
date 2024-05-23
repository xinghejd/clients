import { LoginApiV2 } from "../../api/v2/login.api";

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
}
