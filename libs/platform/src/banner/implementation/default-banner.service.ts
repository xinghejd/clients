import { Observable, map } from "rxjs";

import {
  BANNER_DISK,
  KeyDefinition,
  StateProvider,
  ActiveUserState,
} from "@bitwarden/common/platform/state";

import { BannerService } from "../banner.service";

const STATES_KEY = KeyDefinition.record<boolean>(BANNER_DISK, "states", {
  deserializer: (b) => b,
});

export class DefaultBannerService implements BannerService {
  private bannerStates: ActiveUserState<Record<string, boolean>>;

  constructor(private stateProvider: StateProvider) {
    this.bannerStates = this.stateProvider.getActive(STATES_KEY);
    this.bannerStates$ = this.bannerStates.state$;
  }

  bannerStates$: Observable<Record<string, boolean>>;

  bannerVisibility$(bannerId: string) {
    // TODO: This will return undefined for a bannerId that does not exist, is that okay/expected?
    return this.bannerStates.state$.pipe(map((states) => states[bannerId]));
  }

  async setBannerVisibility(bannerId: string, visibility: boolean) {
    await this.bannerStates.update((states) => {
      states[bannerId] = visibility;
      return states;
    });
  }
}
