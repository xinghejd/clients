import {
  PassphraseGenerationOptions,
  PasswordGenerationOptions,
  CatchallGenerationOptions,
  EffUsernameGenerationOptions,
  ForwarderId,
  UsernameGeneratorType,
  SubaddressGenerationOptions,
  RequestOptions,
} from "@bitwarden/generator";

import { GeneratorNavigation } from "../workflow";

/** Request format for credential generation.
 *  This type includes all properties suitable for reactive data binding.
 */
export type PasswordGeneratorOptions = PasswordGenerationOptions &
  PassphraseGenerationOptions &
  GeneratorNavigation & { policyUpdated?: boolean };

export class GeneratedPasswordHistory {
  password: string;
  date: number;

  constructor(password: string, date: number) {
    this.password = password;
    this.date = date;
  }
}

export type UsernameGeneratorOptions = EffUsernameGenerationOptions &
  SubaddressGenerationOptions &
  CatchallGenerationOptions &
  RequestOptions & {
    type?: UsernameGeneratorType;
    forwardedService?: ForwarderId | "";
    forwardedAnonAddyApiToken?: string;
    forwardedAnonAddyDomain?: string;
    forwardedAnonAddyBaseUrl?: string;
    forwardedDuckDuckGoToken?: string;
    forwardedFirefoxApiToken?: string;
    forwardedFastmailApiToken?: string;
    forwardedForwardEmailApiToken?: string;
    forwardedForwardEmailDomain?: string;
    forwardedSimpleLoginApiKey?: string;
    forwardedSimpleLoginBaseUrl?: string;
  };

// this export provided solely for backwards compatibility
export {
  /** @deprecated use `GeneratorNavigation` from './navigation' instead. */
  GeneratorNavigation as GeneratorOptions,
} from "../workflow";

export class EmailForwarderOptions {
  name: string;
  value: string;
  validForSelfHosted: boolean;
}
