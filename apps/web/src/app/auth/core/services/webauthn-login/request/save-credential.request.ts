import { WebauthnLoginResponseRequest } from "./webauthn-login-response.request";

export class SaveCredentialRequest {
  deviceResponse: WebauthnLoginResponseRequest;
  name: string;
  token: string;
}
