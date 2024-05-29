import { GeneratorType, UsernameGeneratorType, ForwarderId } from "@bitwarden/generator";

/** Stores credential generator UI state. */
export type GeneratorNavigation = {
  /** The kind of credential being generated.
   * @remarks The legacy generator only supports "password" and "passphrase".
   *  The componentized generator supports all values.
   */
  type?: GeneratorType;

  /** When `type === "username"`, this stores the username algorithm. */
  username?: UsernameGeneratorType;

  /** When `username === "forwarded"`, this stores the forwarder implementation. */
  forwarder?: ForwarderId | "";
};

/** Policy settings affecting password generator navigation */
export type GeneratorNavigationPolicy = {
  /** The type of generator that should be shown by default when opening
   *  the password generator.
   */
  defaultType?: GeneratorType;
};
