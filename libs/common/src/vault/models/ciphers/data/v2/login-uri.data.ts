import { UriMatchStrategySetting } from "../../../../../models/domain/domain-service";
import { LoginUriApiV2 } from "../../api/v2/login-uri.api";

export class LoginUriDataV2 {
  uri: string;
  uriChecksum: string;
  match: UriMatchStrategySetting = null;

  constructor(data?: LoginUriApiV2) {
    if (data == null) {
      return;
    }
    this.uri = data.uri;
    this.uriChecksum = data.uriChecksum;
    this.match = data.match;
  }
}
