import { Observable } from "rxjs";

export abstract class BannerService {
  /**
   * An observable containing all banners in a record with their id and the visibility.
   */
  bannerStates$: Observable<Record<string, boolean>>;
  /**
   * A method to get an observable tracking the visibility of a banner from its id.
   * @param bannerId The banner id of the visibility to track
   * @returns An observable boolean or undefined showing that state of the observable
   */
  bannerVisibility$: (bannerId: string) => Observable<boolean | undefined>;

  /**
   * A method to set the visibility of a banner via its id.
   * @param bannerId The banner id of the visibility to update.
   * @param visibility A boolean where true means the banner should be visible and false is the banner should be not be visible.
   */
  setBannerVisibility: (bannerId: string, visibility: boolean) => Promise<void>;
}
