import { BehaviorSubject, map, pipe } from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { StateProvider } from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";

import { GeneratorStrategy, Randomizer } from "../abstractions";
import { DefaultPasswordGenerationOptions, DisabledPasswordGeneratorPolicy } from "../data";
import { PasswordGeneratorOptionsEvaluator, leastPrivilege } from "../policies/password";
import { distinctIfShallowMatch, reduceCollection } from "../rx";
import { PasswordGenerationOptions, PasswordGeneratorPolicy } from "../types";

import { PASSWORD_SETTINGS } from "./storage";

/** {@link GeneratorStrategy} */
export class PasswordGeneratorStrategy
  implements GeneratorStrategy<PasswordGenerationOptions, PasswordGeneratorPolicy>
{
  /** instantiates the password generator strategy.
   *  @param legacy generates the password
   */
  constructor(
    private randomizer: Randomizer,
    private stateProvider: StateProvider,
  ) {}

  /** {@link GeneratorStrategy.durableState} */
  durableState(id: UserId) {
    return this.stateProvider.getUser(id, PASSWORD_SETTINGS);
  }

  /** Gets the default options. */
  defaults$(_: UserId) {
    return new BehaviorSubject({ ...DefaultPasswordGenerationOptions }).asObservable();
  }

  /** {@link GeneratorStrategy.policy} */
  get policy() {
    return PolicyType.PasswordGenerator;
  }

  /** {@link GeneratorStrategy.toEvaluator} */
  toEvaluator() {
    return pipe(
      reduceCollection(leastPrivilege, DisabledPasswordGeneratorPolicy),
      distinctIfShallowMatch(),
      map((policy) => new PasswordGeneratorOptionsEvaluator(policy)),
    );
  }

  /** {@link GeneratorStrategy.generate} */
  async generate(options: PasswordGenerationOptions): Promise<string> {
    const o = { ...DefaultPasswordGenerationOptions, ...options };
    let positions: string[] = [];
    if (o.lowercase && o.minLowercase > 0) {
      for (let i = 0; i < o.minLowercase; i++) {
        positions.push("l");
      }
    }
    if (o.uppercase && o.minUppercase > 0) {
      for (let i = 0; i < o.minUppercase; i++) {
        positions.push("u");
      }
    }
    if (o.number && o.minNumber > 0) {
      for (let i = 0; i < o.minNumber; i++) {
        positions.push("n");
      }
    }
    if (o.special && o.minSpecial > 0) {
      for (let i = 0; i < o.minSpecial; i++) {
        positions.push("s");
      }
    }
    while (positions.length < o.length) {
      positions.push("a");
    }

    // shuffle
    positions = await this.randomizer.shuffle(positions);

    // build out the char sets
    let allCharSet = "";

    let lowercaseCharSet = "abcdefghijkmnopqrstuvwxyz";
    if (o.ambiguous) {
      lowercaseCharSet += "l";
    }
    if (o.lowercase) {
      allCharSet += lowercaseCharSet;
    }

    let uppercaseCharSet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    if (o.ambiguous) {
      uppercaseCharSet += "IO";
    }
    if (o.uppercase) {
      allCharSet += uppercaseCharSet;
    }

    let numberCharSet = "23456789";
    if (o.ambiguous) {
      numberCharSet += "01";
    }
    if (o.number) {
      allCharSet += numberCharSet;
    }

    const specialCharSet = "!@#$%^&*";
    if (o.special) {
      allCharSet += specialCharSet;
    }

    let password = "";
    for (let i = 0; i < o.length; i++) {
      let positionChars: string;
      switch (positions[i]) {
        case "l":
          positionChars = lowercaseCharSet;
          break;
        case "u":
          positionChars = uppercaseCharSet;
          break;
        case "n":
          positionChars = numberCharSet;
          break;
        case "s":
          positionChars = specialCharSet;
          break;
        case "a":
          positionChars = allCharSet;
          break;
        default:
          break;
      }

      const randomCharIndex = await this.randomizer.uniform(0, positionChars.length - 1);
      password += positionChars.charAt(randomCharIndex);
    }

    return password;
  }
}
