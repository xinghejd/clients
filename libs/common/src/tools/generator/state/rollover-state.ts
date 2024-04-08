import { Observable, concatMap, filter, map, switchMap } from "rxjs";

import {
  StateProvider,
  SingleUserState,
  CombinedState,
  StateUpdateOptions,
} from "../../../platform/state";

import { RolloverKeyDefinition } from "./rollover-key-definition";

/** Stateful storage that rolls data from an input state to an output
 *  state. When rollover occurs, the input state is automatically deleted.
 */
export class RolloverState<Input, Output> implements SingleUserState<Output> {
  constructor(
    provider: StateProvider,
    private key: RolloverKeyDefinition<Input, Output>,
    private outputState: SingleUserState<Output>,
  ) {
    this.inputState = provider.getUser(outputState.userId, key.toKeyDefinition());

    this.state$ = this.inputState.state$.pipe(
      concatMap(async (state) => {
        // emit the output state when there's no update pending
        if (state === null) {
          return true;
        }

        // when there is an update, suppress the emission;
        // `switchMap` handles it by emitting a new output state once
        // the `null` update round-trips
        await this.updateOutput();
        return false;
      }),
      filter((bypass) => bypass),
      switchMap(() => this.outputState.state$),
    );

    this.combinedState$ = this.state$.pipe(map((state) => [this.outputState.userId, state]));
  }

  private inputState: SingleUserState<Input>;

  private async updateOutput() {
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
    if (!(await this.key.isValid(input))) {
      await this.inputState.update(() => null);
      return;
    }

    // rollover anything left
    const output = await this.key.map(input);
    await this.outputState.update(() => output);
    await this.inputState.update(() => null);

    return;
  }

  /** {@link SingleUserState.userId} */
  get userId() {
    return this.outputState.userId;
  }

  /** Observes changes to the decrypted secret state. The observer
   *  updates after the secret has been recorded to state storage.
   *  @returns `undefined` when the account is locked.
   */
  readonly state$: Observable<Output>;

  /** {@link SingleUserState.combinedState$} */
  readonly combinedState$: Observable<CombinedState<Output>>;

  /** Creates a new rollover state. The rollover state overwrites the output
   *  state when a subscription occurs.
   *  @param rolloverState the state to roll over.
   */
  rollover(rolloverState: Input): Promise<Input> {
    return this.inputState.update(() => rolloverState);
  }

  /** Updates the output state.
   *  @param configureState a callback that returns an updated decrypted
   *   secret state. The callback receives the state's present value as its
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
