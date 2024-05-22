import {
  ForwarderMetadata,
  CatchallGenerationOptions,
  EffUsernameGenerationOptions,
  PasswordGenerationOptions,
  PassphraseGenerationOptions,
  SubaddressGenerationOptions,
  Boundary,
  SelfHostedApiOptions,
  EmailDomainOptions,
  ApiOptions,
  EmailPrefixOptions,
  PassphraseGeneratorPolicy,
  PasswordGeneratorPolicy
} from "./types";

/** The default options for passphrase generation. */
export const DefaultPassphraseGenerationOptions: Partial<PassphraseGenerationOptions> =
  Object.freeze({
    numWords: 3,
    wordSeparator: "-",
    capitalize: false,
    includeNumber: false,
  });

  /** The default options for catchall address generation. */
export const DefaultCatchallOptions: Readonly<CatchallGenerationOptions> = Object.freeze({
  catchallType: "random",
  catchallDomain: "",
  website: null,
});

/** The default options for EFF long word generation. */
export const DefaultEffUsernameOptions: Readonly<EffUsernameGenerationOptions> = Object.freeze({
  wordCapitalize: false,
  wordIncludeNumber: false,
  website: null,
});

/** The default options for email subaddress generation. */
export const DefaultSubaddressOptions: Readonly<SubaddressGenerationOptions> = Object.freeze({
  subaddressType: "random",
  subaddressEmail: "",
  website: null,
});

export const DefaultFastmailOptions: ApiOptions & EmailPrefixOptions = Object.freeze({
  website: null,
  domain: "",
  prefix: "",
  token: "",
});

export const DefaultDuckDuckGoOptions: ApiOptions = Object.freeze({
  website: null,
  token: "",
});

export const DefaultFirefoxRelayOptions: ApiOptions = Object.freeze({
  website: null,
  token: "",
});

export const DefaultForwardEmailOptions: ApiOptions & EmailDomainOptions = Object.freeze({
  website: null,
  token: "",
  domain: "",
});

export const DefaultSimpleLoginOptions: SelfHostedApiOptions = Object.freeze({
  website: null,
  baseUrl: "https://app.simplelogin.io",
  token: "",
});

export const DefaultAddyIoOptions: SelfHostedApiOptions & EmailDomainOptions = Object.freeze({
  website: null,
  baseUrl: "https://app.addy.io",
  token: "",
  domain: "",
});

function initializePasswordGeneratorBoundaries() {
  const length : Readonly<Boundary> = Object.freeze({
    min: 5,
    max: 128,
  });

  const minDigits : Readonly<Boundary> = Object.freeze({
    min: 0,
    max: 9,
  });

  const minSpecialCharacters: Readonly<Boundary> = Object.freeze({
    min: 0,
    max: 9,
  });

  return Object.freeze({
    length,
    minDigits,
    minSpecialCharacters,
  } as const);
}

export const DefaultPasswordGeneratorBoundaries = initializePasswordGeneratorBoundaries();

/** The default options for password generation. */
export const DefaultPasswordGenerationOptions: Partial<PasswordGenerationOptions> = Object.freeze({
  length: 14,
  minLength: DefaultPasswordGeneratorBoundaries.length.min,
  ambiguous: true,
  uppercase: true,
  lowercase: true,
  number: true,
  minNumber: 1,
  special: false,
  minSpecial: 0,
});

function initializePassphraseGeneratorBoundaries() {
  const numWords : Readonly<Boundary> = Object.freeze({
    min: 3,
    max: 20,
  });

  return Object.freeze({
    numWords,
  } as const);
}

/** Immutable default boundaries for passphrase generation.
 * These are used when the policy does not override a value.
 */
export const DefaultPassphraseGeneratorBoundaries = initializePassphraseGeneratorBoundaries();

/** The default options for password generation policy. */
export const DisabledPassphraseGeneratorPolicy: PassphraseGeneratorPolicy = Object.freeze({
  minNumberWords: 0,
  capitalize: false,
  includeNumber: false,
});

/** The default options for password generation policy. */
export const DisabledPasswordGeneratorPolicy: PasswordGeneratorPolicy = Object.freeze({
  minLength: 0,
  useUppercase: false,
  useLowercase: false,
  useNumbers: false,
  numberCount: 0,
  useSpecial: false,
  specialCount: 0,
});

function initializeForwarders() {
  /** For https://addy.io/ */
  const AddyIo : Readonly<ForwarderMetadata> = Object.freeze({
    id: "anonaddy",
    name: "Addy.io",
    validForSelfHosted: true,
  });

  /** For https://duckduckgo.com/email/ */
  const DuckDuckGo : Readonly<ForwarderMetadata> = Object.freeze({
    id: "duckduckgo",
    name: "DuckDuckGo",
    validForSelfHosted: false,
  });

  /** For https://www.fastmail.com. */
  const Fastmail : Readonly<ForwarderMetadata> = Object.freeze({
    id: "fastmail",
    name: "Fastmail",
    validForSelfHosted: true,
  });

  /** For https://relay.firefox.com/ */
  const FirefoxRelay : Readonly<ForwarderMetadata> = Object.freeze({
    id: "firefoxrelay",
    name: "Firefox Relay",
    validForSelfHosted: false,
  });

  /** For https://forwardemail.net/ */
  const ForwardEmail : Readonly<ForwarderMetadata> = Object.freeze({
    id: "forwardemail",
    name: "Forward Email",
    validForSelfHosted: true,
  });

  /** For https://simplelogin.io/ */
  const SimpleLogin = Object.freeze({
    id: "simplelogin",
    name: "SimpleLogin",
    validForSelfHosted: true,
  });

  return Object.freeze({
    AddyIo,
    DuckDuckGo,
    Fastmail,
    FirefoxRelay,
    ForwardEmail,
    SimpleLogin
  } as const);
}

/** Metadata about an email forwarding service.
 *  @remarks This is used to populate the forwarder selection list
 *  and to identify forwarding services in error messages.
 */
export const Forwarders = initializeForwarders();
