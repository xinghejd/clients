import _ from "lodash";

import {
  ApiOptions,
  SelfHostedApiOptions,
  EmailDomainOptions,
  EmailPartOptions,
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
    fastMail: ApiOptions & EmailPartOptions & MaybeLeakedOptions;

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
    website: "",
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
    return _.defaults(options.forwarders.addyIo, DefaultOptions.forwarders.addyIo);
  } else if (service === ForwarderIds.DuckDuckGo) {
    return _.defaults(options.forwarders.duckDuckGo, DefaultOptions.forwarders.duckDuckGo);
  } else if (service === ForwarderIds.FastMail) {
    return _.defaults(options.forwarders.fastMail, DefaultOptions.forwarders.fastMail);
  } else if (service === ForwarderIds.FirefoxRelay) {
    return _.defaults(options.forwarders.firefoxRelay, DefaultOptions.forwarders.firefoxRelay);
  } else if (service === ForwarderIds.ForwardEmail) {
    return _.defaults(options.forwarders.forwardEmail, DefaultOptions.forwarders.forwardEmail);
  } else if (service === ForwarderIds.SimpleLogin) {
    return _.defaults(options.forwarders.simpleLogin, DefaultOptions.forwarders.simpleLogin);
  }
}
