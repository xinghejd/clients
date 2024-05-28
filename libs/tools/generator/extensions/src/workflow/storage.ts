import { GENERATOR_DISK, UserKeyDefinition } from "@bitwarden/common/src/platform/state";

import { GeneratorNavigation } from "./types";

/** plaintext password generation options */
export const GENERATOR_SETTINGS = new UserKeyDefinition<GeneratorNavigation>(
  GENERATOR_DISK,
  "generatorSettings",
  {
    deserializer: (value) => value,
    clearOn: ["logout"],
  },
);
