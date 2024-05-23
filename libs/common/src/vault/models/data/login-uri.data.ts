import { UriMatchStrategySetting } from "../../../models/domain/domain-service";
import { LoginUriApiLatest } from "../ciphers/api/latest";

export class LoginUriData {
  uri: string;
  uriChecksum: string;
  match: UriMatchStrategySetting = null;

  // TODO: Implement version support
  constructor(data?: LoginUriApiLatest) {
    if (data == null) {
      return;
    }
    this.uri = data.uri;
    this.uriChecksum = data.uriChecksum;
    this.match = data.match;
  }
}
