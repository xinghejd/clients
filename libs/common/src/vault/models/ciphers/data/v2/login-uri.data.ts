import { UriMatchStrategySetting } from "../../../../../models/domain/domain-service";
import { LoginUriApiV2 } from "../../api/v2/login-uri.api";
import { LoginUriDataV1 } from "../v1/login-uri.data";

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

  static migrate(old: LoginUriDataV1): LoginUriDataV2 {
    const migrated = new LoginUriDataV2();

    migrated.uri = old.uri;
    migrated.uriChecksum = old.uriChecksum;
    migrated.match = old.match;

    return migrated;
  }
}
