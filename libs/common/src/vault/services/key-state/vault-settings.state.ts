import { VAULT_SETTINGS_DISK, UserKeyDefinition, KeyDefinition } from "../../../platform/state";

export const USER_ENABLE_PASSKEYS = new KeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "enablePasskeys",
  {
    deserializer: (obj) => obj,
  },
);

export const SHOW_CARDS_CURRENT_TAB = new UserKeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "showCardsCurrentTab",
  {
    deserializer: (obj) => obj,
    clearOn: [], // User setting, don't clear on lock or logout
  },
);

export const SHOW_IDENTITIES_CURRENT_TAB = new UserKeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "showIdentitiesCurrentTab",
  { deserializer: (obj) => obj, clearOn: [] }, // User setting, don't clear on lock or logout
);
