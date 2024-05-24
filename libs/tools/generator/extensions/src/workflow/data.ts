import { GeneratorNavigation, GeneratorNavigationPolicy } from "./types";

/** The default options for password generation. */
export const DefaultGeneratorNavigation: GeneratorNavigation = Object.freeze({
  type: "password",
  username: "word",
  forwarder: "",
} as const);

/** The default options for password generation policy. */
export const DisabledGeneratorNavigationPolicy: GeneratorNavigationPolicy = Object.freeze({
  defaultType: undefined,
});
