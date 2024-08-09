import { UserId } from "@bitwarden/common/types/guid";

import { LockComponentService } from "./lock-component.service";

export class DefaultLockComponentService implements LockComponentService {
  constructor() {}

  getBiometricsError(error: any): string | null {
    return null;
  }

  async isFido2Session(): Promise<boolean> {
    return false;
  }

  async isWindowVisible(): Promise<boolean> {
    return false;
  }

  async biometricsEnabled(userId: UserId): Promise<boolean> {
    return false;
  }
}
