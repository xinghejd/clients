import {
  firstValueFrom,
  share,
  timer,
  ReplaySubject,
  Observable,
  race,
  debounceTime,
  skip,
} from "rxjs";

// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { PolicyService } from "../../admin-console/abstractions/policy/policy.service.abstraction";
import { UserId } from "../../types/guid";

import { GeneratorStrategy, GeneratorService, PolicyEvaluator } from "./abstractions";

type DefaultGeneratorServiceTuning = {
  /* number of policy updates to ignore before monitoring policy.
   * WARNING: When this setting is used, you must also specify the timeout,
   * or the generator may not load.
   */
  policyIgnoreQty: number;

  /* amount of time to wait for policy updates before processing the most recent emission.
   * WARNING: this setting delays generator calculations.
   */
  policyTimeoutMs: number;

  /* amount of time to keep the most recent policy after a subscription ends. Once the
   * cache expires, the ignoreQty and timeoutMs settings apply to the next lookup.
   */
  policyCacheMs: number;
};

/** {@link GeneratorServiceAbstraction} */
export class DefaultGeneratorService<Options, Policy> implements GeneratorService<Options, Policy> {
  /** Instantiates the generator service
   * @param strategy tailors the service to a specific generator type
   *            (e.g. password, passphrase)
   * @param policy provides the policy to enforce
   */
  constructor(
    private strategy: GeneratorStrategy<Options, Policy>,
    private policy: PolicyService,
    tuning: Partial<DefaultGeneratorServiceTuning> = {},
  ) {
    this.tuning = Object.assign(tuning, {
      // at time of writing, the first two policy emissions after unlock
      // are always the on-disk settings
      policyIgnoreQty: 2,
      // half a second
      policyTimeoutMs: 500,
      // a minute
      policyCacheMs: 60000,
    });
  }

  private tuning: DefaultGeneratorServiceTuning;
  private _evaluators$ = new Map<UserId, Observable<PolicyEvaluator<Policy, Options>>>();

  /** {@link GeneratorService.options$} */
  options$(userId: UserId) {
    return this.strategy.durableState(userId).state$;
  }

  /** {@link GeneratorService.defaults$} */
  defaults$(userId: UserId) {
    return this.strategy.defaults$(userId);
  }

  /** {@link GeneratorService.saveOptions} */
  async saveOptions(userId: UserId, options: Options): Promise<void> {
    await this.strategy.durableState(userId).update(() => options);
  }

  /** {@link GeneratorService.evaluator$} */
  evaluator$(userId: UserId) {
    let evaluator$ = this._evaluators$.get(userId);

    if (!evaluator$) {
      evaluator$ = this.createEvaluator(userId);
      this._evaluators$.set(userId, evaluator$);
    }

    return evaluator$;
  }

  private createEvaluator(userId: UserId) {
    const policy$ = this.policy.getAll$(this.strategy.policy, userId);

    // give the policy service some time to refresh the policy when there
    // are changes syncing
    //
    // FIXME: replace this race with a solution that updates once sync
    // policy
    const stablePolicy$ = race(
      // if there's less than 3 entries after a half of a second,
      // take the last one
      policy$.pipe(skip(this.tuning.policyIgnoreQty)),
      policy$.pipe(debounceTime(this.tuning.policyTimeoutMs)),
    );

    const evaluator$ = stablePolicy$.pipe(
      // create the evaluator from the policies
      this.strategy.toEvaluator(),

      // cache evaluator in a replay subject to amortize creation cost
      // and reduce GC pressure.
      share({
        connector: () => new ReplaySubject(1),
        resetOnRefCountZero: () => timer(this.tuning.policyCacheMs),
      }),
    );

    return evaluator$;
  }

  /** {@link GeneratorService.enforcePolicy} */
  async enforcePolicy(userId: UserId, options: Options): Promise<Options> {
    const policy = await firstValueFrom(this.evaluator$(userId));
    const evaluated = policy.applyPolicy(options);
    const sanitized = policy.sanitize(evaluated);
    return sanitized;
  }

  /** {@link GeneratorService.generate} */
  async generate(options: Options): Promise<string> {
    return await this.strategy.generate(options);
  }
}
