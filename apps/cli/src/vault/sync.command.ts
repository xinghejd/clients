import { SyncService } from "@bitwarden/common/platform/sync";

import { MessageResponse } from "../models/response/message.response.js";
import { StringResponse } from "../models/response/string.response.js";
import { Response } from "../models/response.js";
import { CliUtils } from "../utils.js";

export class SyncCommand {
  constructor(private syncService: SyncService) {}

  async run(cmdOptions: Record<string, any>): Promise<Response> {
    const normalizedOptions = new Options(cmdOptions);
    if (normalizedOptions.last) {
      return await this.getLastSync();
    }

    try {
      await this.syncService.fullSync(normalizedOptions.force, true);
      const res = new MessageResponse("Syncing complete.", null);
      return Response.success(res);
    } catch (e) {
      return Response.error("Syncing failed: " + e.toString());
    }
  }

  private async getLastSync() {
    const lastSyncDate = await this.syncService.getLastSync();
    const res = new StringResponse(lastSyncDate == null ? null : lastSyncDate.toISOString());
    return Response.success(res);
  }
}

class Options {
  last: boolean;
  force: boolean;

  constructor(passedOptions: Record<string, any>) {
    this.last = CliUtils.convertBooleanOption(passedOptions?.last);
    this.force = CliUtils.convertBooleanOption(passedOptions?.force);
  }
}
