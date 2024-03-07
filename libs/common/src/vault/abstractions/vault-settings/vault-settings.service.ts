import { Observable } from "rxjs";

import { UriMatchType } from "../../enums";

/**
 * Service for managing vault settings.
 */
export abstract class VaultSettingsService {
  /**
   * An observable monitoring the state of the enable passkeys setting.
   * The observable updates when the setting changes.
   */
  enablePasskeys$: Observable<boolean>;
  /**
   * An observable monitoring the state of the default URI match setting.
   */
  defaultUriMatch$: Observable<UriMatchType>;
  /**
   * An observable monitoring the state of the show cards on the current tab.
   */
  dontShowCardsCurrentTab$: Observable<boolean>;
  /**
   * An observable monitoring the state of the show identities on the current tab.
   */
  dontShowIdentitiesCurrentTab$: Observable<boolean>;
  /**
   * An observable monitoring the state of the disable fav icon setting.
   */
  disableFavicon$: Observable<boolean>;

  /**
   * Saves the enable passkeys setting to disk.
   * @param value The new value for the passkeys setting.
   */
  setEnablePasskeys: (value: boolean) => Promise<void>;
  /**
   * Saves the default URI match setting to disk.
   * @param value The new value for the default URI match setting.
   */
  setDefaultUriMatch: (value: UriMatchType) => Promise<void>;
  /**
   * Saves the show cards on tab page setting to disk.
   * @param value The new value for the show cards on tab page setting.
   */
  setDontShowCardsCurrentTab: (value: boolean) => Promise<void>;
  /**
   * Saves the show identities on tab page setting to disk.
   * @param value The new value for the show identities on tab page setting.
   */
  setDontShowIdentitiesCurrentTab: (value: boolean) => Promise<void>;
  /**
   * Saves the disable fav icon setting to disk.
   * @param value The new value for the disable fav icon setting.
   */
  setDisableFavicon: (value: boolean) => Promise<void>;
}
