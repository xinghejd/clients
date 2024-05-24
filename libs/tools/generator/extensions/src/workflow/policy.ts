import { PolicyType } from "@bitwarden/common/src/admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "@bitwarden/common/src/admin-console/models/domain/policy";
import { PolicyEvaluator } from "@bitwarden/generator";

import { DefaultGeneratorNavigation } from "./data";
import { GeneratorNavigation, GeneratorNavigationPolicy } from "./types";

/** Reduces a policy into an accumulator by preferring the password generator
 *  type to other generator types.
 *  @param acc the accumulator
 *  @param policy the policy to reduce
 *  @returns the resulting `GeneratorNavigationPolicy`
 */
export function preferPassword(
  acc: GeneratorNavigationPolicy,
  policy: Policy,
): GeneratorNavigationPolicy {
  const isEnabled = policy.type === PolicyType.PasswordGenerator && policy.enabled;
  if (!isEnabled) {
    return acc;
  }

  const isOverridable = acc.defaultType !== "password" && policy.data.defaultType;
  const result = isOverridable ? { ...acc, defaultType: policy.data.defaultType } : acc;

  return result;
}

/** Enforces policy for generator navigation options.
 */
export class GeneratorNavigationEvaluator
  implements PolicyEvaluator<GeneratorNavigationPolicy, GeneratorNavigation>
{
  /** Instantiates the evaluator.
   * @param policy The policy applied by the evaluator. When this conflicts with
   *               the defaults, the policy takes precedence.
   */
  constructor(readonly policy: GeneratorNavigationPolicy) {}

  /** {@link PolicyEvaluator.policyInEffect} */
  get policyInEffect(): boolean {
    return this.policy?.defaultType ? true : false;
  }

  /** Apply policy to the input options.
   *  @param options The options to build from. These options are not altered.
   *  @returns A new password generation request with policy applied.
   */
  applyPolicy(options: GeneratorNavigation): GeneratorNavigation {
    return options;
  }

  /** Ensures internal options consistency.
   *  @param options The options to cascade. These options are not altered.
   *  @returns A passphrase generation request with cascade applied.
   */
  sanitize(options: GeneratorNavigation): GeneratorNavigation {
    const defaultType = this.policyInEffect
      ? this.policy.defaultType
      : DefaultGeneratorNavigation.type;
    return {
      ...options,
      type: options.type ?? defaultType,
    };
  }
}
