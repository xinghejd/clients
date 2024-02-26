import { Observable } from "rxjs";

import { PolicyEvaluator } from "./policy-evaluator.abstraction";

/** Generates credentials used for user authentication
 *  @typeParam Options the credential generation configuration
 *  @typeParam Policy the policy enforced by the generator
 */
export abstract class GeneratorService<Options, Policy> {
  /** An observable monitoring the options saved to disk.
   *  The observable updates when the options are saved.
   */
  abstract options$: Observable<Options>;

  /** An observable monitoring the options used to enforce policy.
   *  The observable updates when the policy changes.
   */
  abstract policy$: Observable<PolicyEvaluator<Policy, Options>>;

  /** Enforces the policy on the given options
   * @param options the options to enforce the policy on
   * @returns a new instance of the options with the policy enforced
   */
  abstract enforcePolicy(options: Options): Promise<Options>;

  /** Generates credentials
   * @param options the options to generate credentials with
   * @returns a promise that resolves with the generated credentials
   */
  abstract generate(options: Options): Promise<string>;

  /** Saves the given options to disk.
   * @param options the options to save
   * @returns a promise that resolves when the options are saved
   */
  abstract saveOptions(options: Options): Promise<void>;
}
