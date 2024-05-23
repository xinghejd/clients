import { UriMatchStrategySetting } from "../../../../../models/domain/domain-service";
import { LoginUriApiV1 } from "../../api/v1/login-uri.api";

export class LoginUriDataV1 {
  uri: string;
  uriChecksum: string;
  match: UriMatchStrategySetting = null;

  constructor(data?: LoginUriApiV1) {
    if (data == null) {
      return;
    }
    this.uri = data.uri;
    this.uriChecksum = data.uriChecksum;
    this.match = data.match;
  }
}
