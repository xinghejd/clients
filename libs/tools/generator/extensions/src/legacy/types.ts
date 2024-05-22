import { CatchallGenerationOptions } from "./catchall-generator-options";
import { EffUsernameGenerationOptions } from "./eff-username-generator-options";
import { ForwarderId, RequestOptions } from "./options/forwarder-options";
import { UsernameGeneratorType } from "./options/generator-options";
import { SubaddressGenerationOptions } from "./subaddress-generator-options";

import { GeneratorNavigation } from "../navigation/generator-navigation";
import { PassphraseGenerationOptions } from "../passphrase/passphrase-generation-options";

import { PasswordGenerationOptions } from "./password-generation-options";

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
} from "./navigation/generator-navigation";

