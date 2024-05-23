import { LoginApiV1 } from "../../api/v1/login.api";

import { Fido2CredentialDataV1 } from "./fido2-credential.data";
import { LoginUriDataV1 } from "./login-uri.data";

export class LoginDataV1 {
  uris: LoginUriDataV1[];
  username: string;
  password: string;
  passwordRevisionDate: string;
  totp: string;
  autofillOnPageLoad: boolean;
  fido2Credentials?: Fido2CredentialDataV1[];

  constructor(data?: LoginApiV1) {
    if (data == null) {
      return;
    }

    this.username = data.username;
    this.password = data.password;
    this.passwordRevisionDate = data.passwordRevisionDate;
    this.totp = data.totp;
    this.autofillOnPageLoad = data.autofillOnPageLoad;

    if (data.uris) {
      this.uris = data.uris.map((u) => new LoginUriDataV1(u));
    }

    if (data.fido2Credentials) {
      this.fido2Credentials = data.fido2Credentials?.map((key) => new Fido2CredentialDataV1(key));
    }
  }
}
