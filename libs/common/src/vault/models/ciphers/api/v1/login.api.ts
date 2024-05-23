import { JsonObject } from "type-fest";

import { BaseResponse } from "../../../../../models/response/base.response";

import { Fido2CredentialApiV1 } from "./fido2-credential.api";
import { LoginUriApiV1 } from "./login-uri.api";

export class LoginApiV1 extends BaseResponse {
  uris: LoginUriApiV1[];
  username: string;
  password: string;
  passwordRevisionDate: string;
  totp: string;
  autofillOnPageLoad: boolean;
  fido2Credentials?: Fido2CredentialApiV1[];

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }
    this.username = this.getResponseProperty("Username");
    this.password = this.getResponseProperty("Password");
    this.passwordRevisionDate = this.getResponseProperty("PasswordRevisionDate");
    this.totp = this.getResponseProperty("Totp");
    this.autofillOnPageLoad = this.getResponseProperty("AutofillOnPageLoad");

    const uris = this.getResponseProperty("Uris");
    if (uris != null) {
      this.uris = uris.map((u: any) => new LoginUriApiV1(u));
    }

    const fido2Credentials = this.getResponseProperty("Fido2Credentials");
    if (fido2Credentials != null) {
      this.fido2Credentials = fido2Credentials.map(
        (key: JsonObject) => new Fido2CredentialApiV1(key),
      );
    }
  }
}
