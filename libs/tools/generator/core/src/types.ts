/** The kind of credential being generated. */
export type GeneratorType = Proof | Identity;

/** Combines password and passphrase types. */
// FIXME is there a better name than "Proof"? "PassX"?
export type Proof = "password" | "passphrase";

/** All username/email types. */
export type Identity = "username";

/** ways you can generate usernames
 *  "word" generates a username from the eff word list
 * "subaddress" creates a subaddress of an email.
 * "catchall" uses a domain's catchall address
 * "forwarded" uses an email forwarding service
 */
export type UsernameGeneratorType = "word" | "subaddress" | "catchall" | "forwarded";

/** Several username generators support two generation modes
 *  "random" selects one or more random words from the EFF word list
 *  "website-name" includes the domain in the generated username
 */
export type UsernameGenerationMode = "random" | "website-name";

export type Boundary = {
  readonly min: number;
  readonly max: number;
};

/** Request format for password credential generation.
 *  All members of this type may be `undefined` when the user is
 *  generating a passphrase.
 *
 * @remarks The name of this type is a bit of a misnomer. This type
 *          it is used with the "password generator" types. The name
 *          `PasswordGeneratorOptions` is already in use by legacy code.
 */
export type PasswordGenerationOptions = {
  /** The length of the password selected by the user */
  length?: number;

  /** The minimum length of the password. This defaults to 5, and increases
   * to ensure `minLength` is at least as large as the sum of the other minimums.
   */
  minLength?: number;

  /** `true` when ambiguous characters may be included in the output.
   *  `false` when ambiguous characters should not be included in the output.
   */
  ambiguous?: boolean;

  /** `true` when uppercase ASCII characters should be included in the output
   * This value defaults to `false.
   */
  uppercase?: boolean;

  /** The minimum number of uppercase characters to include in the output.
   *  The value is ignored when `uppercase` is `false`.
   *  The value defaults to 1 when `uppercase` is `true`.
   */
  minUppercase?: number;

  /** `true` when lowercase ASCII characters should be included in the output.
   * This value defaults to `false`.
   */
  lowercase?: boolean;

  /** The minimum number of lowercase characters to include in the output.
   * The value defaults to 1 when `lowercase` is `true`.
   * The value defaults to 0 when `lowercase` is `false`.
   */
  minLowercase?: number;

  /** Whether or not to include ASCII digits in the output
   * This value defaults to `true` when `minNumber` is at least 1.
   * This value defaults to `false` when `minNumber` is less than 1.
   */
  number?: boolean;

  /** The minimum number of digits to include in the output.
   * The value defaults to 1 when `number` is `true`.
   * The value defaults to 0 when `number` is `false`.
   */
  minNumber?: number;

  /** Whether or not to include special characters in the output.
   * This value defaults to `true` when `minSpecial` is at least 1.
   * This value defaults to `false` when `minSpecial` is less than 1.
   */
  special?: boolean;

  /** The minimum number of special characters to include in the output.
   * This value defaults to 1 when `special` is `true`.
   * This value defaults to 0 when `special` is `false`.
   */
  minSpecial?: number;
};



/** Settings supported when generating an email subaddress */
export type SubaddressGenerationOptions = {
  /** selects the generation algorithm for the catchall email address. */
  subaddressType?: UsernameGenerationMode;

  /** the email address the subaddress is applied to. */
  subaddressEmail?: string;
} & RequestOptions;





/** Settings supported when generating a username using the EFF word list */
export type EffUsernameGenerationOptions = {
  /** when true, the word is capitalized */
  wordCapitalize?: boolean;

  /** when true, a random number is appended to the username */
  wordIncludeNumber?: boolean;
} & RequestOptions;





/** Settings supported when generating an email subaddress */
export type CatchallGenerationOptions = {
  /** selects the generation algorithm for the catchall email address. */
  catchallType?: UsernameGenerationMode;

  /** The domain part of the generated email address.
   *  @example If the domain is `domain.io` and the generated username
   *  is `jd`, then the generated email address will be `jd@mydomain.io`
   */
  catchallDomain?: string;
} & RequestOptions;



/** Request format for passphrase credential generation.
 *  The members of this type may be `undefined` when the user is
 *  generating a password.
 */
export type PassphraseGenerationOptions = {
  /** The number of words to include in the passphrase.
   * This value defaults to 3.
   */
  numWords?: number;

  /** The ASCII separator character to use between words in the passphrase.
   * This value defaults to a dash.
   * If multiple characters appear in the string, only the first character is used.
   */
  wordSeparator?: string;

  /** `true` when the first character of every word should be capitalized.
   * This value defaults to `false`.
   */
  capitalize?: boolean;

  /** `true` when a number should be included in the passphrase.
   * This value defaults to `false`.
   */
  includeNumber?: boolean;
};

/** Type representing an absence of policy. */
export type NoPolicy = Record<string, never>;

/** Policy options enforced during passphrase generation. */
export type PassphraseGeneratorPolicy = {
  minNumberWords: number;
  capitalize: boolean;
  includeNumber: boolean;
};

/** Policy options enforced during password generation. */
export type PasswordGeneratorPolicy = {
  /** The minimum length of generated passwords.
   *  When this is less than or equal to zero, it is ignored.
   *  If this is less than the total number of characters required by
   *  the policy's other settings, then it is ignored.
   */
  minLength: number;

  /** When this is true, an uppercase character must be part of
   *  the generated password.
   */
  useUppercase: boolean;

  /** When this is true, a lowercase character must be part of
   *  the generated password.
   */
  useLowercase: boolean;

  /** When this is true, at least one digit must be part of the generated
   *  password.
   */
  useNumbers: boolean;

  /** The quantity of digits to include in the generated password.
   *  When this is less than or equal to zero, it is ignored.
   */
  numberCount: number;

  /** When this is true, at least one digit must be part of the generated
   *  password.
   */
  useSpecial: boolean;

  /** The quantity of special characters to include in the generated
   *  password. When this is less than or equal to zero, it is ignored.
   */
  specialCount: number;
};


export type ForwarderIds = ForwarderSettings["id"];

export type ForwarderSettings = AnonAddySettings | DuckDuckGoSettings | FastmailSettings | FirefoxRelaySettings | ForwardEmailSettings | SimpleLoginSettings;

export type AnonAddySettings = {
  id: "anonaddy",
  settings: SelfHostedApiOptions & EmailDomainOptions
};

export type DuckDuckGoSettings = {
  id: "duckduckgo",
  settings: ApiOptions
}

export type FastmailSettings = {
  id: "fastmail",
  settings: ApiOptions & EmailPrefixOptions
}

export type FirefoxRelaySettings = {
  id: "firefoxrelay",
  settings: ApiOptions
}

export type ForwardEmailSettings = {
  id: "forwardemail",
  settings: ApiOptions & EmailDomainOptions
}

export type SimpleLoginSettings = {
  id: "simplelogin",
  settings: SelfHostedApiOptions
}


/** Identifiers for email forwarding services.
 *  @remarks These are used to select forwarder-specific options.
 *  The must be kept in sync with the forwarder implementations.
 */
export type ForwarderId =
  | "anonaddy"
  | "duckduckgo"
  | "fastmail"
  | "firefoxrelay"
  | "forwardemail"
  | "simplelogin";

/** Metadata format for email forwarding services. */
export type ForwarderMetadata = {
  /** The unique identifier for the forwarder. */
  id: ForwarderId;

  /** The name of the service the forwarder queries. */
  name: string;

  /** Whether the forwarder is valid for self-hosted instances of Bitwarden. */
  validForSelfHosted: boolean;
};

/** Options common to all forwarder APIs */
export type ApiOptions = {
  /** bearer token that authenticates bitwarden to the forwarder.
   *  This is required to issue an API request.
   */
  token?: string;
} & RequestOptions;

/** Options that provide contextual information about the application state
 *  when a forwarder is invoked.
 *  @remarks these fields should always be omitted when saving options.
 */
export type RequestOptions = {
  /** @param website The domain of the website the generated email is used
   *  within. This should be set to `null` when the request is not specific
   *  to any website.
   */
  website: string | null;
};

/** Api configuration for forwarders that support self-hosted installations. */
export type SelfHostedApiOptions = ApiOptions & {
  /** The base URL of the forwarder's API.
   *  When this is empty, the forwarder's default production API is used.
   */
  baseUrl: string;
};

/** Api configuration for forwarders that support custom domains. */
export type EmailDomainOptions = {
  /** The domain part of the generated email address.
   *  @remarks The domain should be authorized by the forwarder before
   *           submitting a request through bitwarden.
   *  @example If the domain is `domain.io` and the generated username
   *  is `jd`, then the generated email address will be `jd@mydomain.io`
   */
  domain: string;
};

/** Api configuration for forwarders that support custom email parts. */
export type EmailPrefixOptions = EmailDomainOptions & {
  /** A prefix joined to the generated email address' username.
   *  @example If the prefix is `foo`, the generated username is `bar`,
   *  and the domain is `domain.io`, then the generated email address is `
   *  then the generated username is `foobar@domain.io`.
   */
  prefix: string;
};

export type WordOptions = {
  /** set the first letter uppercase */
  titleCase?: boolean,
  /** append a number */
  number?: boolean
};
