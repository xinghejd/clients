import { Observable } from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy as OrgPolicy } from "@bitwarden/common/admin-console/models/domain/policy";
import { SingleUserState } from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";

import { WordOptions } from "./types";

/** Generates credentials used for user authentication
 *  @typeParam Options the credential generation configuration
 *  @typeParam Policy the policy enforced by the generator
 */
export abstract class GeneratorService<Options, Policy> {
  /** An observable monitoring the options saved to disk.
   *  The observable updates when the options are saved.
   *   @param userId: Identifies the user making the request
   */
  options$: (userId: UserId) => Observable<Options>;

  /** An observable monitoring the options used to enforce policy.
   *  The observable updates when the policy changes.
   *  @param userId: Identifies the user making the request
   */
  evaluator$: (userId: UserId) => Observable<PolicyEvaluator<Policy, Options>>;

  /** Gets the default options. */
  defaults$: (userId: UserId) => Observable<Options>;

  /** Enforces the policy on the given options
   * @param userId: Identifies the user making the request
   * @param options the options to enforce the policy on
   * @returns a new instance of the options with the policy enforced
   */
  enforcePolicy: (userId: UserId, options: Options) => Promise<Options>;

  /** Generates credentials
   * @param options the options to generate credentials with
   * @returns a promise that resolves with the generated credentials
   */
  generate: (options: Options) => Promise<string>;

  /** Saves the given options to disk.
   * @param userId: Identifies the user making the request
   * @param options the options to save
   * @returns a promise that resolves when the options are saved
   */
  saveOptions: (userId: UserId, options: Options) => Promise<void>;
}

/** Applies policy to a generation request */
export abstract class PolicyEvaluator<GeneratorPolicy, Target> {
  /** The policy to enforce */
  policy: GeneratorPolicy;

  /** Returns true when a policy is being enforced by the evaluator.
   * @remarks `applyPolicy` should be called when a policy is not in
   *           effect to enforce the application's default policy.
   */
  policyInEffect: boolean;

  /** Apply policy to a set of options.
   *  @param options The options to build from. These options are not altered.
   *  @returns A complete generation request with policy applied.
   *  @remarks This method only applies policy overrides.
   *           Pass the result to `sanitize` to ensure consistency.
   */
  applyPolicy: (options: Target) => Target;

  /** Ensures internal options consistency.
   *  @param options The options to cascade. These options are not altered.
   *  @returns A new generation request with cascade applied.
   *  @remarks  This method fills null and undefined values by looking at
   *  pairs of flags and values (e.g. `number` and `minNumber`). If the flag
   *  and value are inconsistent, the flag cascades to the value.
   */
  sanitize: (options: Target) => Target;
}

/** Tailors the generator service to generate a specific kind of credentials */
export abstract class GeneratorStrategy<Options, GeneratorPolicy> {
  /** Retrieve application state that persists across locks.
   *  @param userId: identifies the user state to retrieve
   *  @returns the strategy's durable user state
   */
  durableState: (userId: UserId) => SingleUserState<Options>;

  /** Gets the default options. */
  defaults$: (userId: UserId) => Observable<Options>;

  /** Identifies the policy enforced by the generator. */
  policy: PolicyType;

  /** Operator function that converts a policy collection observable to a single
   *   policy evaluator observable.
   * @param policy The policy being evaluated.
   * @returns the policy evaluator. If `policy` is is `null` or `undefined`,
   * then the evaluator defaults to the application's limits.
   * @throws when the policy's type does not match the generator's policy type.
   */
  toEvaluator: () => (
    source: Observable<OrgPolicy[]>,
  ) => Observable<PolicyEvaluator<GeneratorPolicy, Options>>;

  /** Generates credentials from the given options.
   * @param options The options used to generate the credentials.
   * @returns a promise that resolves to the generated credentials.
   */
  generate: (options: Options) => Promise<string>;
}

export interface Randomizer {
  pick<Entry>(list: Array<Entry>): Promise<Entry>;

  pickWord(list: Array<string>, options?: WordOptions) : Promise<string>;

  shuffle<Entry>(items: Array<Entry>) : Promise<Array<Entry>>;

  chars(length: number): Promise<string>;

  uniform(min: number, max: number): Promise<number>;
}

