// eslint-disable-next-line -- `StateDefinition` used as an argument
import { StateDefinition } from "@bitwarden/common/platform/state/state-definition";
import { KeyDefinition, KeyDefinitionOptions } from "../../../platform/state";

/** A set of options for customizing the behavior of a {@link RolloverKeyDefinition}
 */
export type RolloverKeyDefinitionOptions<Input, Output> = KeyDefinitionOptions<Input> & {
  /** Checks whether the input type can be converted to the output type.
   *  @returns `true` if the definition is valid, otherwise `false`. If this
   *  function is not specified, any truthy input is valid.
   *
   * @remarks this is intended for cases where you're working with validated or
   * signed data. It should be used to prevent data from being "laundered" through
   * synchronized state.
   */
  isValid?: (input: Input) => Promise<boolean>;

  /** Transforms the input data format to its output format.
   *  @returns the converted value. If this function is not specified, the value
   *  is asserted as the output type.
   *
   * @remarks This is intended for converting between, say, a replication format
   * and a disk format or rotating encryption keys.
   */
  map?: (input: Input) => Promise<Output>;
}; /** Storage and mapping settings for data stored by a `RolloverState`.
 */

export class RolloverKeyDefinition<Input, Output> {
  /**
   * Defines a rollover state
   * @param stateDefinition The domain of the rollover's temporary state.
   * @param key Domain key that identifies the rollover value. This key must
   *    not be reused in any capacity.
   * @param options Configures the operation of the rollover state.
   */
  constructor(
    readonly stateDefinition: StateDefinition,
    readonly key: string,
    readonly options: RolloverKeyDefinitionOptions<Input, Output>,
  ) {}

  toKeyDefinition() {
    const rolloverKey = new KeyDefinition<Input>(this.stateDefinition, this.key, this.options);

    return rolloverKey;
  }

  /** Converts the input data format to its output format.
   *  @returns the converted value.
   */
  map(input: Input) {
    const map = this.options?.map;
    if (map) {
      return map(input);
    }

    return Promise.resolve(input as unknown as Output);
  }

  /** Checks whether the input type can be converted to the output type.
   *  @returns `true` if the definition is valid, otherwise `false`.
   */
  isValid(input: Input) {
    const isValid = this.options?.isValid;
    if (isValid) {
      return isValid(input);
    }

    return Promise.resolve(input ? true : false);
  }
}
