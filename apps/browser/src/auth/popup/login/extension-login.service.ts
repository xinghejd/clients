import { DefaultLoginService, LoginService } from "@bitwarden/auth/angular";

import { flagEnabled } from "../../../platform/flags"; // TODO-rr-bw: do I need a client specific `flagEnabled()` fn?

export class ExtensionLoginService extends DefaultLoginService implements LoginService {
  getShowPasswordlessFlag(): boolean {
    return flagEnabled("showPasswordless");
  }
}
