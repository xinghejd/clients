import { Observable, combineLatest, concatMap, filter, map, of } from "rxjs";

import {
  StateProvider,
  SingleUserState,
  CombinedState,
  StateUpdateOptions,
} from "../../../platform/state";

import { RolloverKeyDefinition } from "./rollover-key-definition";

/** Stateful storage that rolls data from an input state to an output
 *  state. When rollover occurs, the input state is automatically deleted.
 *  @remarks The rollover state can only rollover non-nullish values. If the
 *   rollover key contains `null` or `undefined`, it will do nothing.
 */
export class RolloverState<Input, Output, Dependency> implements SingleUserState<Output> {
  /**
   * Instantiate a rollover state
   * @param provider constructs the temporary rollover state.
   * @param key defines the temporary rollover state.
   * @param outputState updates when a rollover occurs
   * @param dependency$ provides data the rollover depends upon to evaluate and
   *   transform its data. If this is omitted, then `true` is injected as
   *   a dependency.
   *
   * @remarks `dependency$` enables rollover control during dynamic circumstances,
   *   such as when a rollover should occur only if a user key is available.
   */
  constructor(
    provider: StateProvider,
    private key: RolloverKeyDefinition<Input, Output, Dependency>,
    private outputState: SingleUserState<Output>,
    dependency$: Observable<Dependency> = null,
  ) {
    this.inputState = provider.getUser(outputState.userId, key.toKeyDefinition());

    const watching = [
      this.inputState.state$,
      this.outputState.state$,
      dependency$ ?? of(true as unknown as Dependency),
    ] as const;

    this.state$ = combineLatest(watching).pipe(
      concatMap(async ([input, output, dependency]) => {
        const normalized = input ?? null;

        const canRollover = normalized !== null && key.shouldRollover(dependency);
        if (canRollover) {
          await this.updateOutput(dependency);

          // prevent duplicate updates by suppressing the update
          return [false, output] as const;
        }

        return [true, output] as const;
      }),
      filter(([updated]) => updated),
      map(([, output]) => output),
    );

    this.combinedState$ = this.state$.pipe(map((state) => [this.outputState.userId, state]));

    this.inputState$ = this.inputState.state$;
  }

  private inputState: SingleUserState<Input>;

  private async updateOutput(dependency: Dependency) {
    // retrieve the latest input value
    let input: Input;
    await this.inputState.update((state) => state, {
      shouldUpdate: (state) => {
        input = state;
        return false;
      },
    });

    // bail if this update lost the race with the last update
    if (input === null) {
      return;
    }

    // destroy invalid data and bail
    if (!(await this.key.isValid(input, dependency))) {
      await this.inputState.update(() => null);
      return;
    }

    // rollover anything left; the updates need to be awaited with `Promise.all` so that
    // `inputState.update(() => null)` runs before `shouldUpdate` reads the value (above).
    // This lets the emission from `this.outputState.update` renter the `concatMap`. If the
    // awaits run in sequence, it can win the race and cause a double emission.
    const output = await this.key.map(input, dependency);
    await Promise.all([this.outputState.update(() => output), this.inputState.update(() => null)]);

    return;
  }

  /** {@link SingleUserState.userId} */
  get userId() {
    return this.outputState.userId;
  }

  /** Observes changes to the output state. This updates when the output
   *  state updates, when a rollover occurs, and when `RolloverState.rollover`
   *  is invoked.
   */
  readonly state$: Observable<Output>;

  /** {@link SingleUserState.combinedState$} */
  readonly combinedState$: Observable<CombinedState<Output>>;

  /** Creates a new rollover state. The rollover state overwrites the output
   *  state when a subscription occurs.
   *  @param value the state to roll over. Setting this to `null` or `undefined`
   *  has no effect.
   */
  async rollover(value: Input): Promise<void> {
    const normalized = value ?? null;
    if (normalized !== null) {
      await this.inputState.update(() => normalized);
    }
  }

  /** The data presently pending rollover. This emits the pending value each time
   *  new rollover data is provided. It emits null when there is no data pending
   *  rollover.
   */
  readonly inputState$: Observable<Input>;

  /** Updates the output state.
   *  @param configureState a callback that returns an updated output
   *   state. The callback receives the state's present value as its
   *   first argument and the dependencies listed in `options.combinedLatestWith`
   *   as its second argument.
   *  @param options configures how the update is applied. See {@link StateUpdateOptions}.
   */
  update<TCombine>(
    configureState: (state: Output, dependencies: TCombine) => Output,
    options: StateUpdateOptions<Output, TCombine> = null,
  ): Promise<Output> {
    return this.outputState.update(configureState, options);
  }
}
