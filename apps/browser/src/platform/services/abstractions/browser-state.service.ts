import { StateService as BaseStateServiceAbstraction } from "@bitwarden/common/platform/abstractions/state.service";
import { StorageOptions } from "@bitwarden/common/platform/models/domain/storage-options";

import { Account } from "../../../models/account";
import { BrowserComponentState } from "../../../models/browserComponentState";
import { BrowserGroupingsComponentState } from "../../../models/browserGroupingsComponentState";
import { BrowserSendComponentState } from "../../../models/browserSendComponentState";

export abstract class BrowserStateService extends BaseStateServiceAbstraction<Account> {
  /**
   * Provides special init logic that should only be called from popup contexts,
   * this should be called **after** the base {@link init} method.
   */
  popupInit: () => Promise<void>;
  getBrowserGroupingComponentState: (
    options?: StorageOptions
  ) => Promise<BrowserGroupingsComponentState>;
  setBrowserGroupingComponentState: (
    value: BrowserGroupingsComponentState,
    options?: StorageOptions
  ) => Promise<void>;
  getBrowserVaultItemsComponentState: (options?: StorageOptions) => Promise<BrowserComponentState>;
  setBrowserVaultItemsComponentState: (
    value: BrowserComponentState,
    options?: StorageOptions
  ) => Promise<void>;
  getBrowserSendComponentState: (options?: StorageOptions) => Promise<BrowserSendComponentState>;
  setBrowserSendComponentState: (
    value: BrowserSendComponentState,
    options?: StorageOptions
  ) => Promise<void>;
  getBrowserSendTypeComponentState: (options?: StorageOptions) => Promise<BrowserComponentState>;
  setBrowserSendTypeComponentState: (
    value: BrowserComponentState,
    options?: StorageOptions
  ) => Promise<void>;
}
