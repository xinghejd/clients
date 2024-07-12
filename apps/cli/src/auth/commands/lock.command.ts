import { VaultTimeoutService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout.service";

import { MessageResponse } from "../../models/response/message.response.js";
import { Response } from "../../models/response.js";

export class LockCommand {
  constructor(private vaultTimeoutService: VaultTimeoutService) {}

  async run() {
    await this.vaultTimeoutService.lock();
    process.env.BW_SESSION = null;
    const res = new MessageResponse("Your vault is locked.", null);
    return Response.success(res);
  }
}
