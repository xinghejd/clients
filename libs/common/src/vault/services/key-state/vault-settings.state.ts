import { VAULT_SETTINGS_DISK, KeyDefinition } from "../../../platform/state";
import { UriMatchType } from "../../enums";

export const USER_ENABLE_PASSKEYS = new KeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "enablePasskeys",
  {
    deserializer: (obj) => obj,
  },
);

export const DEFAULT_URI_MATCH = new KeyDefinition<UriMatchType>(
  VAULT_SETTINGS_DISK,
  "defaultUriMatch",
  {
    deserializer: (obj) => obj,
  },
);

export const DONT_SHOW_CARDS_CURRENT_TAB = new KeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "dontShowCardsCurrentTab",
  {
    deserializer: (obj) => obj,
  },
);

export const DONT_SHOW_IDENTITIES_CURRENT_TAB = new KeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "dontShowIdentitiesCurrentTab",
  { deserializer: (obj) => obj },
);

export const DISABLE_FAVICON = new KeyDefinition<boolean>(VAULT_SETTINGS_DISK, "disableFavicon", {
  deserializer: (obj) => obj,
});
