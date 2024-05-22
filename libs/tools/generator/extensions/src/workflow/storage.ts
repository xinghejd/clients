import { GENERATOR_DISK, UserKeyDefinition } from "../../platform/state";

import { GeneratorNavigation } from "./navigation/generator-navigation";

/** plaintext password generation options */
export const GENERATOR_SETTINGS = new UserKeyDefinition<GeneratorNavigation>(
  GENERATOR_DISK,
  "generatorSettings",
  {
    deserializer: (value) => value,
    clearOn: ["logout"],
  },
);
