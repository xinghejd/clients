import { BehaviorSubject, map, pipe } from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { EFFLongWordList } from "@bitwarden/common/platform/misc/wordlist";
import { StateProvider } from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";

import { GeneratorStrategy, Randomizer } from "../abstractions";
import { DefaultPassphraseGenerationOptions, DisabledPassphraseGeneratorPolicy } from "../data";
import { PassphraseGeneratorOptionsEvaluator, leastPrivilege } from "../policies/passphrase";
import { distinctIfShallowMatch, reduceCollection } from "../rx";
import { PassphraseGenerationOptions, PassphraseGeneratorPolicy } from "../types";

import { PASSPHRASE_SETTINGS } from "./storage";

/** {@link GeneratorStrategy} */
export class PassphraseGeneratorStrategy
  implements GeneratorStrategy<PassphraseGenerationOptions, PassphraseGeneratorPolicy>
{
  /** instantiates the password generator strategy.
   *  @param legacy generates the passphrase
   *  @param stateProvider provides durable state
   */
  constructor(
    private randomizer: Randomizer,
    private stateProvider: StateProvider,
  ) {}

  /** {@link GeneratorStrategy.durableState} */
  durableState(id: UserId) {
    return this.stateProvider.getUser(id, PASSPHRASE_SETTINGS);
  }

  /** Gets the default options. */
  defaults$(_: UserId) {
    return new BehaviorSubject({ ...DefaultPassphraseGenerationOptions }).asObservable();
  }

  /** {@link GeneratorStrategy.policy} */
  get policy() {
    return PolicyType.PasswordGenerator;
  }

  /** {@link GeneratorStrategy.toEvaluator} */
  toEvaluator() {
    return pipe(
      reduceCollection(leastPrivilege, DisabledPassphraseGeneratorPolicy),
      distinctIfShallowMatch(),
      map((policy) => new PassphraseGeneratorOptionsEvaluator(policy)),
    );
  }

  /** {@link GeneratorStrategy.generate} */
  async generate(options: PassphraseGenerationOptions): Promise<string> {
    const o = { ...DefaultPassphraseGenerationOptions, ...options };
    if (o.numWords == null || o.numWords <= 2) {
      o.numWords = DefaultPassphraseGenerationOptions.numWords;
    }
    if (o.capitalize == null) {
      o.capitalize = false;
    }
    if (o.includeNumber == null) {
      o.includeNumber = false;
    }

    // select which word gets the number, if any
    let luckyNumber = -1;
    if (o.includeNumber) {
      luckyNumber = await this.randomizer.uniform(0, o.numWords);
    }

    // generate the passphrase
    const wordList = new Array(o.numWords);
    for (let i = 0; i < o.numWords; i++) {
      const word = await this.randomizer.pickWord(EFFLongWordList, {
        titleCase: o.capitalize,
        number: i === luckyNumber,
      });

      wordList[i] = word;
    }

    return wordList.join(o.wordSeparator);
  }
}
