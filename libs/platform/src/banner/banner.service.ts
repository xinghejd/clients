import { Observable, map } from "rxjs";

import {
  ActiveUserState,
  BANNER_DISK,
  KeyDefinition,
  StateProvider,
} from "@bitwarden/common/platform/state";

const STATES_KEY = KeyDefinition.record<boolean>(BANNER_DISK, "states", {
  deserializer: (b) => b,
});

export class BannerService {
  private bannerStates: ActiveUserState<Record<string, boolean>>;

  constructor(private stateProvider: StateProvider) {
    this.bannerStates = this.stateProvider.getActive(STATES_KEY);
    this.bannerStates$ = this.bannerStates.state$;
  }

  /**
   * An observable containing all banners in a record with their id and the visibility.
   */
  bannerStates$: Observable<Record<string, boolean>>;
  /**
   * A method to get an observable tracking the visibility of a banner from its id.
   * @param bannerId The banner id of the visibility to track
   * @returns An observable boolean or undefined showing that state of the observable
   */
  bannerVisibility$(bannerId: string) {
    return this.bannerStates.state$.pipe(map((states) => states[bannerId]));
  }

  /**
   * A method to set the visibility of a banner via its id.
   * @param bannerId The banner id of the visibility to update.
   * @param visibility A boolean where true means the banner should be visible and false is the banner should be not be visible.
   */
  async setBannerVisibility(bannerId: string, visibility: boolean) {
    await this.bannerStates.update((states) => {
      states[bannerId] = visibility;
      return states;
    });
  }
}
