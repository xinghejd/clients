import { firstValueFrom } from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { SdkService } from "@bitwarden/common/platform/abstractions/sdk/sdk.service";
import { devFlagEnabled } from "@bitwarden/common/platform/misc/flags";
import { StateProvider } from "@bitwarden/common/platform/state";

import { GeneratorStrategy } from "../abstractions";
import { Policies, DefaultPasswordGenerationOptions } from "../data";
import { PasswordRandomizer } from "../engine";
import { mapPolicyToEvaluator } from "../rx";
import { PasswordGenerationOptions, PasswordGeneratorPolicy } from "../types";
import { observe$PerUserId, optionsToRandomAsciiRequest, sharedStateByUserId } from "../util";

import { PASSWORD_SETTINGS } from "./storage";

/** Generates passwords composed of random characters */
export class PasswordGeneratorStrategy
  implements GeneratorStrategy<PasswordGenerationOptions, PasswordGeneratorPolicy>
{
  /** instantiates the password generator strategy.
   *  @param legacy generates the password
   */
  constructor(
    private randomizer: PasswordRandomizer,
    private stateProvider: StateProvider,
    private configService: ConfigService,
    private sdkService: SdkService,
  ) {}

  // configuration
  durableState = sharedStateByUserId(PASSWORD_SETTINGS, this.stateProvider);
  defaults$ = observe$PerUserId(() => DefaultPasswordGenerationOptions);
  readonly policy = PolicyType.PasswordGenerator;
  toEvaluator() {
    return mapPolicyToEvaluator(Policies.Password);
  }

  // algorithm
  async generate(options: PasswordGenerationOptions): Promise<string> {
    const request = optionsToRandomAsciiRequest(options);

    if (
      devFlagEnabled("sdk") &&
      (await firstValueFrom(this.configService.getFeatureFlag$(FeatureFlag.SDKPasswordGenerator)))
    ) {
      const client = await firstValueFrom(this.sdkService.client$);

      return await client.generators().password({
        avoidAmbiguous: request.ambiguous,
        length: options.length,
        lowercase: request.lowercase > 0,
        minLowercase: request.lowercase,
        numbers: request.digits > 0,
        minNumber: request.digits,
        special: request.special > 0,
        minSpecial: request.special,
        uppercase: request.uppercase > 0,
        minUppercase: request.uppercase,
      });
    } else {
      return await this.randomizer.randomAscii(request);
    }
  }
}
