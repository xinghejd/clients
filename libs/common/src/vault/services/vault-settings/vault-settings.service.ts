import { Observable, map } from "rxjs";

import { ActiveUserState, GlobalState, StateProvider } from "../../../platform/state";
import { VaultSettingsService as VaultSettingsServiceAbstraction } from "../../abstractions/vault-settings/vault-settings.service";
import { UriMatchType } from "../../enums";
import {
  DEFAULT_URI_MATCH,
  DISABLE_FAVICON,
  DONT_SHOW_CARDS_CURRENT_TAB,
  DONT_SHOW_IDENTITIES_CURRENT_TAB,
  USER_ENABLE_PASSKEYS,
} from "../key-state/vault-settings.state";

/**
 * {@link VaultSettingsServiceAbstraction}
 */
export class VaultSettingsService implements VaultSettingsServiceAbstraction {
  private enablePasskeysState: GlobalState<boolean> =
    this.stateProvider.getGlobal(USER_ENABLE_PASSKEYS);

  private defaultUriMatchState: ActiveUserState<UriMatchType> =
    this.stateProvider.getActive(DEFAULT_URI_MATCH);

  private dontShowCardsCurrentTabState: ActiveUserState<boolean> = this.stateProvider.getActive(
    DONT_SHOW_CARDS_CURRENT_TAB,
  );

  private dontShowIdentitiesCurrentTabState: ActiveUserState<boolean> =
    this.stateProvider.getActive(DONT_SHOW_IDENTITIES_CURRENT_TAB);

  private disableFaviconState: GlobalState<boolean> = this.stateProvider.getGlobal(DISABLE_FAVICON);

  /**
   * {@link VaultSettingsServiceAbstraction.enablePasskeys$}
   */
  readonly enablePasskeys$: Observable<boolean> = this.enablePasskeysState.state$.pipe(
    map((x) => x ?? true),
  );

  /**
   * {@link VaultSettingsServiceAbstraction.defaultUriMatch$}
   */
  readonly defaultUriMatch$: Observable<UriMatchType> = this.defaultUriMatchState.state$.pipe(
    map((x) => x ?? UriMatchType.Domain),
  );

  /**
   * {@link VaultSettingsServiceAbstraction.dontShowCardsCurrentTab$}
   */
  readonly dontShowCardsCurrentTab$: Observable<boolean> =
    this.dontShowCardsCurrentTabState.state$.pipe(map((x) => x ?? true));

  /**
   * {@link VaultSettingsServiceAbstraction.dontShowIdentitiesCurrentTab$}
   */
  readonly dontShowIdentitiesCurrentTab$: Observable<boolean> =
    this.dontShowIdentitiesCurrentTabState.state$.pipe(map((x) => x ?? true));

  /**
   * {@link VaultSettingsServiceAbstraction.disableFavicon$}
   */
  readonly disableFavicon$: Observable<boolean> = this.disableFaviconState.state$.pipe(
    map((x) => x ?? true),
  );

  constructor(private stateProvider: StateProvider) {}

  /**
   * {@link VaultSettingsServiceAbstraction.setEnablePasskeys}
   */
  async setEnablePasskeys(value: boolean): Promise<void> {
    await this.enablePasskeysState.update(() => value);
  }

  /**
   * {@link VaultSettingsServiceAbstraction.setDefaultUriMatch}
   */
  async setDefaultUriMatch(value: UriMatchType): Promise<void> {
    await this.defaultUriMatchState.update(() => value);
  }

  /**
   * {@link VaultSettingsServiceAbstraction.setDontShowCardsCurrentTab}
   */
  async setDontShowCardsCurrentTab(value: boolean): Promise<void> {
    await this.dontShowCardsCurrentTabState.update(() => value);
  }

  /**
   * {@link VaultSettingsServiceAbstraction.setDontShowIdentitiesCurrentTab}
   */
  async setDontShowIdentitiesCurrentTab(value: boolean): Promise<void> {
    await this.dontShowIdentitiesCurrentTabState.update(() => value);
  }

  /**
   * {@link VaultSettingsServiceAbstraction.setDisableFavicon}
   */
  async setDisableFavicon(value: boolean): Promise<void> {
    await this.disableFaviconState.update(() => value);
  }
}
