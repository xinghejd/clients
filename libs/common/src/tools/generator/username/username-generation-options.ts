import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";

import {
  ApiOptions,
  SelfHostedApiOptions,
  EmailDomainOptions,
  EmailPrefixOptions,
  ForwarderId,
  Forwarders,
} from "./email-forwarders";

/** Identifies encrypted options that could have leaked from the configuration. */
export type MaybeLeakedOptions = {
  /** When true, encrypted options were previously stored as plaintext.
   *  @remarks This is used to alert the user that the token should be
   *           regenerated. If a token has always been stored encrypted,
   *           this should be omitted.
   */
  wasPlainText?: true;
};

/** Configuration for username generation algorithms. */
export type AlgorithmOptions = {
  /** selects the generation algorithm for the username.
   *  "random" generates a random string.
   *  "website-name" generates a username based on the website's name.
   */
  algorithm: "random" | "website-name";
};

/** Options for generating a username.
 * @remarks This type includes all fields so that the generator
 * remembers the user's configuration for each type of username
 * and forwarder.
 */
export type UsernameGeneratorOptions = {
  /** selects the property group used for username generation */
  type?: "word" | "subaddress" | "catchall" | "forwarded";

  /** When generating a forwarding address for a vault item, this should contain
   *  the domain the vault item supplies to the generator.
   *  @example If the user is creating a vault item for `https://www.domain.io/login`,
   *  then this should be `www.domain.io`.
   */
  website?: string;

  /** When true, the username generator saves options immediately
   * after they're loaded. Otherwise this option should not be defined.
   * */
  saveOnLoad?: true;

  /* Configures generation of a username from the EFF word list */
  word: {
    /** when true, the word is capitalized */
    capitalize?: boolean;

    /** when true, a random number is appended to the username */
    includeNumber?: boolean;
  };

  /** Configures generation of an email subaddress.
   *  @remarks The subaddress is the part following the `+`.
   *  For example, if the email address is `jd+xyz@domain.io`,
   *  the subaddress is `xyz`.
   */
  subaddress: AlgorithmOptions & {
    /** the email address the subaddress is applied to. */
    email?: string;
  };

  /** Configures generation for a domain catch-all address.
   */
  catchall: AlgorithmOptions & EmailDomainOptions;

  /** Configures generation for an email forwarding service address.
   */
  forwarders: {
    /** The service to use for email forwarding.
     *  @remarks This determines which forwarder-specific options to use.
     */
    service?: ForwarderId;

    /** {@link Forwarders.AddyIo} */
    addyIo: SelfHostedApiOptions & EmailDomainOptions & MaybeLeakedOptions;

    /** {@link Forwarders.DuckDuckGo} */
    duckDuckGo: ApiOptions & MaybeLeakedOptions;

    /** {@link Forwarders.FastMail} */
    fastMail: ApiOptions & EmailPrefixOptions & MaybeLeakedOptions;

    /** {@link Forwarders.FireFoxRelay} */
    firefoxRelay: ApiOptions & MaybeLeakedOptions;

    /** {@link Forwarders.ForwardEmail} */
    forwardEmail: ApiOptions & EmailDomainOptions & MaybeLeakedOptions;

    /** {@link forwarders.SimpleLogin} */
    simpleLogin: SelfHostedApiOptions & MaybeLeakedOptions;
  };
};

/** Default options for username generation. */
// freeze all the things to prevent mutation
export const DefaultOptions: UsernameGeneratorOptions = Object.freeze({
  type: "word",
  website: "",
  word: Object.freeze({
    capitalize: true,
    includeNumber: true,
  }),
  subaddress: Object.freeze({
    algorithm: "random",
    email: "",
  }),
  catchall: Object.freeze({
    algorithm: "random",
    domain: "",
  }),
  forwarders: Object.freeze({
    service: Forwarders.Fastmail.id,
    fastMail: Object.freeze({
      domain: "",
      prefix: "",
      token: "",
    }),
    addyIo: Object.freeze({
      baseUrl: "https://app.addy.io",
      domain: "",
      token: "",
    }),
    forwardEmail: Object.freeze({
      token: "",
      domain: "",
    }),
    simpleLogin: Object.freeze({
      baseUrl: "https://app.simplelogin.io",
      token: "",
    }),
    duckDuckGo: Object.freeze({
      token: "",
    }),
    firefoxRelay: Object.freeze({
      token: "",
    }),
  }),
});

/** runs the callback on each forwarder configuration */
export function forAllForwarders<T>(
  options: UsernameGeneratorOptions,
  callback: (options: ApiOptions) => T,
) {
  const results = [];
  for (const forwarder of Object.values(Forwarders).map((f) => f.id)) {
    const forwarderOptions = getForwarderOptions(forwarder, options);
    if (forwarderOptions) {
      results.push(callback(forwarderOptions));
    }
  }
  return results;
}

/** Gets the options for the specified forwarding service with defaults applied.
 *  This method mutates `options`.
 * @param service Identifies the service whose options should be loaded.
 * @param options The options to load from.
 * @returns A reference to the options for the specified service.
 */
export function getForwarderOptions(
  service: string,
  options: UsernameGeneratorOptions,
): ApiOptions & MaybeLeakedOptions {
  if (service === Forwarders.AddyIo.id) {
    return falsyDefault(options.forwarders.addyIo, DefaultOptions.forwarders.addyIo);
  } else if (service === Forwarders.DuckDuckGo.id) {
    return falsyDefault(options.forwarders.duckDuckGo, DefaultOptions.forwarders.duckDuckGo);
  } else if (service === Forwarders.Fastmail.id) {
    return falsyDefault(options.forwarders.fastMail, DefaultOptions.forwarders.fastMail);
  } else if (service === Forwarders.FirefoxRelay.id) {
    return falsyDefault(options.forwarders.firefoxRelay, DefaultOptions.forwarders.firefoxRelay);
  } else if (service === Forwarders.ForwardEmail.id) {
    return falsyDefault(options.forwarders.forwardEmail, DefaultOptions.forwarders.forwardEmail);
  } else if (service === Forwarders.SimpleLogin.id) {
    return falsyDefault(options.forwarders.simpleLogin, DefaultOptions.forwarders.simpleLogin);
  } else {
    return null;
  }
}

/**
 * Recursively applies default values from `defaults` to falsy or
 * missing properties in  `value`.
 *
 * @remarks This method is not aware of the
 * object's prototype or metadata, such as readonly or frozen fields.
 * It should only be used on plain objects.
 *
 * @param value - The value to fill in. This parameter is mutated.
 * @param defaults - The default values to use.
 * @returns the mutated `value`.
 */
export function falsyDefault<T>(value: T, defaults: Partial<T>): T {
  // iterate keys in defaults because `value` may be missing keys
  for (const key in defaults) {
    if (value[key]) {
      continue;
    } else if (typeof defaults === "object") {
      // any cast is required because typescript doesn't know that
      // `value[key]` is an object.
      value[key] = falsyDefault(value[key] ?? ({} as any), defaults[key]);
    } else {
      value[key] = defaults[key];
    }
  }

  return value;
}

/** Padding values used to prevent leaking the length of the encrypted options. */
const SecretPadding = Object.freeze({
  /** The length to pad out encrypted members. This should be at least as long
   *  as the JSON content for the longest JSON payload being encrypted.
   */
  length: 512,

  /** The character to use for padding. */
  character: "0",

  /** A regular expression for detecting invalid padding. When the character
   *  changes, this should be updated to include the new padding pattern.
   */
  hasInvalidPadding: /[^0]/,
});

/** encrypts sensitive options and stores them in-place.
 *  @param encryptService The service used to encrypt the options.
 *  @param key The key used to encrypt the options.
 *  @param options The options to encrypt. The encrypted members are
 *                 removed from the options and the decrypted members
 *                 are added to the options.
 */
export async function encryptInPlace(
  encryptService: EncryptService,
  key: SymmetricCryptoKey,
  options: ApiOptions & MaybeLeakedOptions,
) {
  if (!options.token) {
    return;
  }

  // pick the options that require encryption
  const encryptOptions = (({ token, wasPlainText }) => ({ token, wasPlainText }))(options);
  delete options.token;
  delete options.wasPlainText;

  // don't leak whether a leak was possible by padding the encrypted string.
  // without this, it could be possible to determine whether the token was
  // encrypted by checking the length of the encrypted string.
  const toEncrypt = JSON.stringify(encryptOptions).padEnd(
    SecretPadding.length,
    SecretPadding.character,
  );

  const encrypted = await encryptService.encrypt(toEncrypt, key);
  options.encryptedToken = encrypted;
}

/** decrypts sensitive options and stores them in-place.
 *  @param encryptService The service used to decrypt the options.
 *  @param key The key used to decrypt the options.
 *  @param options The options to decrypt. The encrypted members are
 *                 removed from the options and the decrypted members
 *                 are added to the options.
 *  @returns null if the options were decrypted successfully, otherwise
 *           a string describing why the options could not be decrypted.
 *           The return values are intended to be used for logging and debugging.
 *  @remarks This method does not throw if the options could not be decrypted
 *           because in such cases there's nothing the user can do to fix it.
 */
export async function decryptInPlace(
  encryptService: EncryptService,
  key: SymmetricCryptoKey,
  options: ApiOptions & MaybeLeakedOptions,
) {
  if (!options.encryptedToken) {
    return "missing encryptedToken";
  }

  const decrypted = await encryptService.decryptToUtf8(options.encryptedToken, key);
  delete options.encryptedToken;

  // If the decrypted string is not exactly the padding length, it could be compromised
  // and shouldn't be trusted.
  if (decrypted.length !== SecretPadding.length) {
    return "invalid length";
  }

  // JSON terminates with a closing brace, after which the plaintext repeats `character`
  // If the closing brace is not found, then it could be compromised and shouldn't be trusted.
  const jsonBreakpoint = decrypted.lastIndexOf("}") + 1;
  if (jsonBreakpoint < 1) {
    return "missing json object";
  }

  // If the padding contains invalid padding characters then the padding could be used
  // as a side channel for arbitrary data.
  if (decrypted.substring(jsonBreakpoint).match(SecretPadding.hasInvalidPadding)) {
    return "invalid padding";
  }

  // remove padding and parse the JSON
  const json = decrypted.substring(0, jsonBreakpoint);

  const { decryptedOptions, error } = parseOptions(json);
  if (error) {
    return error;
  }

  Object.assign(options, decryptedOptions);
}

function parseOptions(json: string) {
  let decryptedOptions = null;
  try {
    decryptedOptions = JSON.parse(json);
  } catch {
    return { decryptedOptions: undefined as string, error: "invalid json" };
  }

  // If the decrypted options contain any property that is not in the original
  // options, then the object could be used as a side channel for arbitrary data.
  if (Object.keys(decryptedOptions).some((key) => key !== "token" && key !== "wasPlainText")) {
    return { decryptedOptions: undefined as string, error: "unknown keys" };
  }

  // If the decrypted properties are not the expected type, then the object could
  // be compromised and shouldn't be trusted.
  if (typeof decryptedOptions.token !== "string") {
    return { decryptedOptions: undefined as string, error: "invalid token" };
  }
  if (decryptedOptions.wasPlainText !== undefined && decryptedOptions.wasPlainText !== true) {
    return { decryptedOptions: undefined as string, error: "invalid wasPlainText" };
  }

  return { decryptedOptions, error: undefined as string };
}
