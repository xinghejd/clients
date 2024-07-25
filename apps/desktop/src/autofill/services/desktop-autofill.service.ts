import { UriMatchStrategy } from "@bitwarden/common/models/domain/domain-service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";

import { NativeAutofillStatusCommand } from "../../platform/main/autofill/status.command";
import {
  NativeAutofillFido2Credential,
  NativeAutofillPasswordCredential,
  NativeAutofillSyncCommand,
} from "../../platform/main/autofill/sync.command";
import { isDev } from "../../utils";

export class DesktopAutofillService {
  constructor(
    private logService: LogService,
    private cipherService: CipherService,
  ) {}

  async init() {
    if (isDev()) {
      (window as any).DesktopAutofillService = this;
    }
  }

  async sync() {
    const status = await this.status();
    if (status.type === "error") {
      return this.logService.error("Error getting autofill status", status.error);
    }

    if (!status.value.state.enabled) {
      this.logService.debug("Autofill is disabled");
      return;
    }

    const ciphers = await this.cipherService.getAllDecrypted();

    const fido2Credentials: NativeAutofillFido2Credential[] = [];
    let passwordCredentials: NativeAutofillPasswordCredential[];

    if (status.value.support.password) {
      passwordCredentials = ciphers
        .filter(
          (cipher) =>
            cipher.type === CipherType.Login &&
            cipher.login.uris?.length > 0 &&
            cipher.login.uris.some((uri) => uri.match !== UriMatchStrategy.Never) &&
            cipher.login.uris.some((uri) => !Utils.isNullOrWhitespace(uri.uri)) &&
            !Utils.isNullOrWhitespace(cipher.login.username),
        )
        .map((cipher) => ({
          type: "password",
          cipherId: cipher.id,
          uri: cipher.login.uris.find((uri) => uri.match !== UriMatchStrategy.Never).uri,
          username: cipher.login.username,
        }));
    }

    const syncResult = await ipc.autofill.runCommand<NativeAutofillSyncCommand>({
      command: "sync",
      params: {
        credentials: [...fido2Credentials, ...passwordCredentials],
      },
    });

    if (syncResult.type === "error") {
      return this.logService.error("Error syncing autofill credentials", syncResult.error);
    }

    this.logService.debug("Synced autofill credentials", syncResult.value);
  }

  private status() {
    // TODO: Investigate why this type needs to be explicitly set
    return ipc.autofill.runCommand<NativeAutofillStatusCommand>({
      command: "status",
      params: {},
    });
  }
}
