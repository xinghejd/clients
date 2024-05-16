import { Jsonify } from "type-fest";

import { StorageKey } from "../../types/state";

import { array, record } from "./deserialization-helpers";
import { StateDefinition } from "./state-definition";

/**
 * A set of options for customizing the behavior of a {@link KeyDefinition}
 */
export type KeyDefinitionOptions<T> = {
  /**
   * A function to use to safely convert your type from json to your expected type.
   *
   * **Important:** Your data may be serialized/deserialized at any time and this
   *  callback needs to be able to faithfully re-initialize from the JSON object representation of your type.
   *
   * @param jsonValue The JSON object representation of your state.
   * @returns The fully typed version of your state.
   */
  readonly deserializer: (jsonValue: Jsonify<T>) => T;
  /**
   * The number of milliseconds to wait before cleaning up the state after the last subscriber has unsubscribed.
   * Defaults to 1000ms.
   */
  readonly cleanupDelayMs?: number;
  /**
   * Equality comparison function to use when determining if two values are equal.
   *
   * This method is used to limit unnecessary updates to the state and to ensure that updates await detection and
   * emission to the `state$` observable.
   * Defaults to JSON equality.
   * @param a
   * @param b
   * @returns
   */
  readonly equalityComparer?: (a: T, b: T) => boolean;
};

/**
 * KeyDefinitions describe the precise location to store data for a given piece of state.
 * The StateDefinition is used to describe the domain of the state, and the KeyDefinition
 * sub-divides that domain into specific keys.
 */
export class KeyDefinition<T> {
  /**
   * Creates a new instance of a KeyDefinition
   * @param stateDefinition The state definition for which this key belongs to.
   * @param key The name of the key, this should be unique per domain.
   * @param options A set of options to customize the behavior of {@link KeyDefinition}. All options are required.
   * @param options.deserializer A function to use to safely convert your type from json to your expected type.
   *   Your data may be serialized/deserialized at any time and this needs callback needs to be able to faithfully re-initialize
   *   from the JSON object representation of your type.
   */
  constructor(
    readonly stateDefinition: StateDefinition,
    readonly key: string,
    private readonly options: KeyDefinitionOptions<T>,
  ) {
    if (options.deserializer == null) {
      throw new Error(`'deserializer' is a required property on key ${this.errorKeyName}`);
    }

    if (options.cleanupDelayMs <= 0) {
      throw new Error(
        `'cleanupDelayMs' must be greater than 0. Value of ${options.cleanupDelayMs} passed to key ${this.errorKeyName} `,
      );
    }
  }

  /**
   * Gets the deserializer configured for this {@link KeyDefinition}
   */
  get deserializer() {
    return this.options.deserializer;
  }

  /**
   * Gets the equality comparer configured for this {@link KeyDefinition}
   */
  get equalityComparer() {
    return (
      this.options.equalityComparer ?? ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  /**
   * Gets the number of milliseconds to wait before cleaning up the state after the last subscriber has unsubscribed.
   */
  get cleanupDelayMs() {
    return this.options.cleanupDelayMs < 0 ? 0 : this.options.cleanupDelayMs ?? 1000;
  }

  /**
   * Creates a {@link KeyDefinition} for state that is an array.
   * @param stateDefinition The state definition to be added to the KeyDefinition
   * @param key The key to be added to the KeyDefinition
   * @param options The options to customize the final {@link KeyDefinition}.
   * @returns A {@link KeyDefinition} initialized for arrays, the options run
   * the deserializer on the provided options for each element of an array.
   *
   * @example
   * ```typescript
   * const MY_KEY = KeyDefinition.array<MyArrayElement>(MY_STATE, "key", {
   *   deserializer: (myJsonElement) => convertToElement(myJsonElement),
   * });
   * ```
   */
  static array<T>(
    stateDefinition: StateDefinition,
    key: string,
    // We have them provide options for the element of the array, depending on future options we add, this could get a little weird.
    options: KeyDefinitionOptions<T>, // The array helper forces  an initialValue of an empty array
  ) {
    return new KeyDefinition<T[]>(stateDefinition, key, {
      ...options,
      deserializer: array((e) => options.deserializer(e)),
      equalityComparer: (a: T[], b: T[]) => {
        if (a == null && b == null) {
          return true;
        }

        if (a == null || b == null) {
          return false;
        }

        if (a.length !== b.length) {
          return false;
        }

        const itemComparer =
          options.equalityComparer ?? ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b));
        for (let i = 0; i < a.length; i++) {
          if (!itemComparer(a[i], b[i])) {
            return false;
          }
        }

        return true;
      },
    });
  }

  /**
   * Creates a {@link KeyDefinition} for state that is a record.
   * @param stateDefinition The state definition to be added to the KeyDefinition
   * @param key The key to be added to the KeyDefinition
   * @param options The options to customize the final {@link KeyDefinition}.
   * @returns A {@link KeyDefinition} that contains a serializer that will run the provided deserializer for each
   * value in a record and returns every key as a string.
   *
   * @example
   * ```typescript
   * const MY_KEY = KeyDefinition.record<MyRecordValue>(MY_STATE, "key", {
   *   deserializer: (myJsonValue) => convertToValue(myJsonValue),
   * });
   * ```
   */
  static record<T, TKey extends string | number = string>(
    stateDefinition: StateDefinition,
    key: string,
    // We have them provide options for the value of the record, depending on future options we add, this could get a little weird.
    options: KeyDefinitionOptions<T>, // The array helper forces an initialValue of an empty record
  ) {
    return new KeyDefinition<Record<TKey, T>>(stateDefinition, key, {
      ...options,
      deserializer: record((v) => options.deserializer(v)),
      equalityComparer: (a: Record<TKey, T>, b: Record<TKey, T>) => {
        if (a == null && b == null) {
          return true;
        }

        if (a == null || b == null) {
          return false;
        }

        const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<TKey>;
        const itemComparer =
          options.equalityComparer ?? ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b));
        for (const key of keys) {
          if (!itemComparer(a[key], b[key])) {
            return false;
          }
        }

        return true;
      },
    });
  }

  get fullName() {
    return `${this.stateDefinition.name}_${this.key}`;
  }

  protected get errorKeyName() {
    return `${this.stateDefinition.name} > ${this.key}`;
  }
}

/**
 * Creates a {@link StorageKey}
 * @param keyDefinition The key definition of which data the key should point to.
 * @returns A key that is ready to be used in a storage service to get data.
 */
export function globalKeyBuilder(keyDefinition: KeyDefinition<unknown>): StorageKey {
  return `global_${keyDefinition.stateDefinition.name}_${keyDefinition.key}` as StorageKey;
}
