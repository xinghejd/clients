import {
  Account as BaseAccount,
  AccountSettings as BaseAccountSettings,
  AccountKeys as BaseAccountKeys,
} from "@bitwarden/common/platform/models/domain/account";

export class AccountSettings extends BaseAccountSettings {
  vaultTimeout = -1; // On Restart
}

export class AccountKeys extends BaseAccountKeys {}

export class Account extends BaseAccount {
  settings?: AccountSettings = new AccountSettings();
  keys?: AccountKeys = new AccountKeys();

  constructor(init: Partial<Account>) {
    super(init);
    Object.assign(this.settings, {
      ...new AccountSettings(),
      ...this.settings,
    });
  }
}
