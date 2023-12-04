import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";

import {
  ApiOptions,
  SelfHostedApiOptions,
  EmailDomainOptions,
  EmailPrefixOptions,
} from "./email-forwarders";

/** Identifiers for email forwarding services.
 *  @remarks These are used to select forwarder-specific options
 *  as well as translations for the forwarder's name.
 *  The must be kept in sync with the forwarder implementations.
 */
export const ForwarderIds = Object.freeze({
  /** For https://addy.io/ */
  AddyIo: "anonaddy",

  /** For https://duckduckgo.com/email/ */
  DuckDuckGo: "duckduckgo",

  /** For https://www.fastmail.com. */
  FastMail: "fastmail",

  /** For https://relay.firefox.com/ */
  FirefoxRelay: "firefoxrelay",

  /** For https://forwardemail.net/ */
  ForwardEmail: "forwardemail",

  /** For https://simplelogin.io/ */
  SimpleLogin: "simplelogin",
});

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
    service?: string;

    /** {@link ForwarderIds.AddyIo} */
    addyIo: SelfHostedApiOptions & EmailDomainOptions & MaybeLeakedOptions;

    /** {@link ForwarderIds.DuckDuckGo} */
    duckDuckGo: ApiOptions & MaybeLeakedOptions;

    /** {@link ForwarderIds.FastMail} */
    fastMail: ApiOptions & EmailPrefixOptions & MaybeLeakedOptions;

    /** {@link ForwarderIds.FireFoxRelay} */
    firefoxRelay: ApiOptions & MaybeLeakedOptions;

    /** {@link ForwarderIds.ForwardEmail} */
    forwardEmail: ApiOptions & EmailDomainOptions & MaybeLeakedOptions;

    /** {@link forwarderIds.SimpleLogin} */
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
    service: ForwarderIds.FastMail,
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
  callback: (options: ApiOptions) => T
) {
  const results = [];
  for (const forwarder of Object.values(ForwarderIds)) {
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
  options: UsernameGeneratorOptions
): ApiOptions {
  if (service === ForwarderIds.AddyIo) {
    return Object.assign(
      structuredClone(DefaultOptions.forwarders.addyIo),
      options.forwarders.addyIo
    );
  } else if (service === ForwarderIds.DuckDuckGo) {
    return Object.assign(
      structuredClone(DefaultOptions.forwarders.duckDuckGo),
      options.forwarders.duckDuckGo
    );
  } else if (service === ForwarderIds.FastMail) {
    return Object.assign(
      structuredClone(DefaultOptions.forwarders.fastMail),
      options.forwarders.fastMail
    );
  } else if (service === ForwarderIds.FirefoxRelay) {
    return Object.assign(
      structuredClone(DefaultOptions.forwarders.firefoxRelay),
      options.forwarders.firefoxRelay
    );
  } else if (service === ForwarderIds.ForwardEmail) {
    return Object.assign(
      structuredClone(DefaultOptions.forwarders.forwardEmail),
      options.forwarders.forwardEmail
    );
  } else if (service === ForwarderIds.SimpleLogin) {
    return Object.assign(
      structuredClone(DefaultOptions.forwarders.simpleLogin),
      options.forwarders.simpleLogin
    );
  } else {
    return null;
  }
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
  options: ApiOptions & MaybeLeakedOptions
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
    SecretPadding.character
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
  options: ApiOptions & MaybeLeakedOptions
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
    return { decryptedOptions, error: "invalid json" };
  }

  // If the decrypted options contain any property that is not in the original
  // options, then the object could be used as a side channel for arbitrary data.
  if (Object.keys(decryptedOptions).some((key) => key !== "token" && key !== "wasPlainText")) {
    return { decryptedOptions, error: "unknown keys" };
  }

  // If the decrypted properties are not the expected type, then the object could
  // be compromised and shouldn't be trusted.
  if (typeof decryptedOptions.token !== "string") {
    return { decryptedOptions, error: "invalid token" };
  }
  if (decryptedOptions.wasPlainText !== undefined && decryptedOptions.wasPlainText !== true) {
    return { decryptedOptions, error: "invalid wasPlainText" };
  }

  return decryptedOptions;
}
