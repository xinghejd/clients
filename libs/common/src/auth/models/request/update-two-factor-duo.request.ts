import { SecretVerificationRequest } from "./secret-verification.request";

export class UpdateTwoFactorDuoRequest extends SecretVerificationRequest {
  //TODO - will remove iKey and sKey with PM-8107
  iKey: string;
  sKey: string;
  clientId: string;
  clientSecret: string;
  host: string;
}
